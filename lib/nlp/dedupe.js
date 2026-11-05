// ============================================================
// lib/nlp/dedupe.js — Algorithm 4: Duplicate detection
// TF-IDF + cosine similarity + location match + time proximity.
// Two records describing the same incident merge into one cluster.
// ============================================================

/** Tokenise: lowercase, strip punctuation, drop stopwords. */
export function tokenize(text) {
  const STOP = new Set(['the', 'a', 'an', 'is', 'at', 'on', 'in', 'to', 'of', 'and', 'for', 'near', 'due', 'from', 'with', 'are', 'was', 'it', 'this', 'that', 'be', 'has', 'have', 'very', 'so', 'there']);
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

/** Build TF-IDF vectors for a list of texts. */
export function buildTfIdf(texts) {
  const docs = texts.map(tokenize);
  const df = {};
  docs.forEach((d) => {
    new Set(d).forEach((w) => { df[w] = (df[w] || 0) + 1; });
  });
  const N = docs.length || 1;
  const idf = {};
  for (const [w, c] of Object.entries(df)) idf[w] = Math.log((N + 1) / (c + 1)) + 1;
  const vectors = docs.map((d) => {
    const tf = {};
    d.forEach((w) => { tf[w] = (tf[w] || 0) + 1; });
    const vec = {};
    for (const [w, c] of Object.entries(tf)) vec[w] = (c / d.length) * idf[w];
    return vec;
  });
  return { vectors, idf };
}

export function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k] || 0, y = b[k] || 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = (d) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Cluster duplicate reports.
 * Duplicate if: cosine >= 0.55 AND same/absent location AND within 3h,
 * OR cosine >= 0.75 (near-identical text) within 6h.
 */
export function findDuplicates(reports) {
  const texts = reports.map((r) => r.description || r.post_text || '');
  const { vectors } = buildTfIdf(texts);
  const duplicates = []; // {a, b, similarity, locationMatch, timeDeltaMin, merged_into}
  const clusterOf = new Map(); // index -> cluster id
  let clusterCount = 0;

  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const A = reports[i], B = reports[j];
      const sim = cosineSim(vectors[i], vectors[j]);
      const locA = A.location_name || A.location || null;
      const locB = B.location_name || B.location || null;
      const locationMatch = locA && locB
        ? locA.toLowerCase() === locB.toLowerCase() || Math.abs((A.latitude || 0) - (B.latitude || 0)) < 0.01
        : false;
      const tA = new Date(A.event_time || A.created_at || 0).getTime();
      const tB = new Date(B.event_time || B.created_at || 0).getTime();
      const hoursApart = Math.abs(tA - tB) / 3600000;
      const isDup =
        (sim >= 0.55 && locationMatch && hoursApart <= 3) ||
        (sim >= 0.75 && hoursApart <= 6);
      if (isDup) {
        // merge into the earlier-created cluster
        let root = clusterOf.has(i) ? clusterOf.get(i) : clusterCount++;
        clusterOf.set(i, root);
        clusterOf.set(j, root);
        duplicates.push({
          a: A.id ?? i, b: B.id ?? j, similarity: Math.round(sim * 100) / 100,
          locationMatch, timeDeltaMin: Math.round(hoursApart * 60),
          merged_into: A.id ?? i,
        });
      }
    }
  }
  const clusters = new Map();
  reports.forEach((r, i) => {
    const key = clusterOf.get(i) ?? `solo-${i}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(r.id ?? i);
  });
  return { duplicates, duplicate_count: duplicates.length, unique_clusters: clusters.size, clusters: [...clusters.values()] };
}
