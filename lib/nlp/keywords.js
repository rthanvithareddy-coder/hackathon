// ============================================================
// lib/nlp/keywords.js — Transparent keyword baseline
// Algorithms 1 (relevance), 2 (classification), 6 (severity).
// Every score carries its reasons (explainable AI).
// ============================================================

export const RELEVANCE_KEYWORDS = {
  traffic: 3, jam: 3, congestion: 3, accident: 3, crash: 3,
  collision: 3, waterlogging: 3, 'water logging': 3, flooded: 3,
  flooding: 3, blockade: 3, 'road closed': 3, closure: 3,
  diversion: 3, flyover: 2, metro: 2, bus: 2, mtc: 2, suburban: 2,
  signal: 2, 'one way': 2, construction: 2, 'road work': 2,
  repair: 2, pothole: 2, dug: 2, barricade: 2, 'traffic police': 2,
  stuck: 2, crawling: 2, bumper: 2, stranded: 2, delayed: 2,
  delay: 2, reroute: 2, detour: 2, vehicle: 2, ambulance: 2,
  road: 1, street: 1, highway: 1, route: 1, commute: 1,
  travel: 1, drive: 1, peak: 1, rush: 1,
};

export const IRRELEVANT_KEYWORDS = {
  restaurant: -4, recipe: -4, movie: -3, cricket: -2, cinema: -3,
  'food delivery': -3, shopping: -2, song: -3, stock: -3,
  election: -2, wedding: -2, birthday: -3, joke: -3,
};

export const CATEGORY_KEYWORDS = {
  traffic_congestion: ['traffic', 'jam', 'congestion', 'stuck', 'crawling', 'bumper to bumper', 'peak', 'rush hour', 'slow moving', 'honking', 'gridlock', 'snarl', 'slow'],
  road_accident: ['accident', 'crash', 'collision', 'overturned', 'hit and run', 'injured', 'ambulance', 'pile up', 'bumped'],
  waterlogging: ['waterlogging', 'water logging', 'flooded', 'flooding', 'inundated', 'water stagnation', 'submerged', 'rain water'],
  road_closure: ['closed', 'closure', 'blockade', 'barricade', 'protest', 'bandh', 'no entry', 'sealed'],
  road_construction: ['construction', 'road work', 'repair', 'pothole', 'dug', 'resurfacing', 'asphalting', 'metro work'],
  public_transport_delay: ['bus', 'mtc', 'metro', 'suburban', 'train', 'delayed', 'cancelled', 'service suspended', 'platform'],
  other: [],
};

export const SEVERITY_KEYWORDS = {
  high: ['accident', 'crash', 'injured', 'death', 'killed', 'ambulance', 'fire', 'gas leak', 'pile up', 'submerged', 'stranded', 'collapsed'],
  medium: ['closed', 'closure', 'waterlogging', 'flooded', 'blockade', 'diversion', 'heavy traffic', 'gridlock', 'stuck', 'delay'],
  low: ['pothole', 'construction', 'road work', 'slow', 'moderate traffic', 'signal', 'repair'],
};

/** Algorithm 1 — relevance score 0..100 with reasons. */
export function detectRelevance(text) {
  const t = String(text || '').toLowerCase();
  let score = 0;
  const reasons = [];
  for (const [kw, w] of Object.entries(RELEVANCE_KEYWORDS)) {
    if (t.includes(kw)) { score += w; reasons.push(`+${w} keyword "${kw}"`); }
  }
  for (const [kw, w] of Object.entries(IRRELEVANT_KEYWORDS)) {
    if (t.includes(kw)) { score += w; reasons.push(`${w} irrelevant keyword "${kw}"`); }
  }
  const norm = Math.max(0, Math.min(100, Math.round((score / 6) * 100)));
  return { score: norm, relevant: norm >= 40, reasons };
}

/** Algorithm 2 — multiclass classification by keyword hits. */
export function classifyIncident(text) {
  const t = String(text || '').toLowerCase();
  let best = 'other', bestHits = 0;
  const scores = {};
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    let hits = 0;
    for (const kw of kws) if (t.includes(kw)) hits += 1;
    scores[cat] = hits;
    if (hits > bestHits) { bestHits = hits; best = cat; }
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total ? Math.round((bestHits / total) * 100) : 0;
  return { category: best, confidence, scores };
}

/** Algorithm 6 — severity low/medium/high with explanation. */
export function classifySeverity(text, category) {
  const t = String(text || '').toLowerCase();
  const reasons = [];
  let level = 'low';
  for (const kw of SEVERITY_KEYWORDS.high)
    if (t.includes(kw)) { level = 'high'; reasons.push(`impact keyword "${kw}"`); }
  if (level !== 'high') {
    for (const kw of SEVERITY_KEYWORDS.medium)
      if (t.includes(kw)) { level = 'medium'; reasons.push(`disruption keyword "${kw}"`); }
  }
  if (level === 'low') {
    for (const kw of SEVERITY_KEYWORDS.low)
      if (t.includes(kw)) reasons.push(`minor keyword "${kw}"`);
  }
  if (category === 'road_accident') {
    if (level === 'low') { level = 'medium'; }
    reasons.push('accidents default to at least medium');
  }
  return { severity: level, reasons };
}

export const CATEGORY_LABELS = {
  traffic_congestion: 'Traffic Congestion',
  road_accident: 'Road Accident',
  waterlogging: 'Waterlogging',
  road_closure: 'Road Closure',
  road_construction: 'Road Construction',
  public_transport_delay: 'Public Transport Delay',
  other: 'Other',
};

export const SEVERITY_COLORS = { high: '#d9534f', medium: '#f0a13a', low: '#3a9d6d' };
