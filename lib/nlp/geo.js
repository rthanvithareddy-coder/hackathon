// ============================================================
// lib/nlp/geo.js — Algorithm 3: Location extraction + geocoding
// Gazetteer NER baseline + offline coordinate lookup for Chennai.
// No API keys needed. Unknown places -> city centre flagged approx.
// ============================================================

export const CHENNAI_GAZETTEER = {
  'tambaram': [12.9249, 80.1000],
  'guindy': [13.0067, 80.2206],
  'velachery': [12.9791, 80.2210],
  'anna salai': [13.0350, 80.2400],
  'mount road': [13.0350, 80.2400],
  't nagar': [13.0418, 80.2341],
  'tnagar': [13.0418, 80.2341],
  'omr': [12.9300, 80.2300],
  'old mahabalipuram road': [12.9300, 80.2300],
  'sholinganallur': [12.9010, 80.2279],
  'perungudi': [12.9667, 80.2500],
  'adyar': [13.0060, 80.2570],
  'thiruvanmiyur': [12.9830, 80.2600],
  'marina beach': [13.0500, 80.2820],
  'besant nagar': [13.0002, 80.2668],
  'ecr': [12.9800, 80.2700],
  'east coast road': [12.9800, 80.2700],
  'kathipara': [12.9930, 80.2010],
  'koyambedu': [13.0694, 80.1948],
  'cmbt': [13.0694, 80.1948],
  'anna nagar': [13.0878, 80.2107],
  'egmore': [13.0732, 80.2609],
  'chromepet': [12.9516, 80.1462],
  'pallikaranai': [12.9330, 80.2094],
  'medavakkam': [12.9180, 80.1940],
  'madhavaram': [13.1480, 80.2310],
  'potheri': [12.8230, 80.0440],
  'sriperumbudur': [12.9670, 79.9490],
  'porur': [13.0350, 80.1560],
  'vadapalani': [13.0710, 80.2120],
  'kodambakkam': [13.0550, 80.2250],
  'nungambakkam': [13.0570, 80.2430],
  'mylapore': [13.0330, 80.2690],
  'washermanpet': [13.1130, 80.2870],
  'parrys': [13.0830, 80.2870],
  'chennai central': [13.0827, 80.2757],
  'madhya kailash': [12.9900, 80.2470],
  'tidel park': [12.9920, 80.2470],
  'perambur': [13.1180, 80.2330],
  'ambattur': [13.1143, 80.1548],
  'avadi': [13.1147, 80.1098],
  'saidapet': [13.0210, 80.2230],
  'ashok nagar': [13.0350, 80.2130],
  'vandalur': [12.8920, 80.0800],
  'kelambakkam': [12.8130, 80.2100],
  'navalur': [12.8640, 80.2270],
  'karapakkam': [12.9650, 80.2430],
  'thoraipakkam': [12.9400, 80.2340],
  'siruseri': [12.8230, 80.2300],
  'poonamallee': [13.0480, 80.0960],
  'gst road': [12.9000, 80.1200],
  'chennai': [13.0827, 80.2707],
};

/** Extract location mentions (longest gazetteer match wins). */
export function extractLocations(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9\s'-]/g, ' ') + ' ';
  const found = [];
  for (const place of Object.keys(CHENNAI_GAZETTEER)) {
    if (place === 'chennai') continue;
    const re = new RegExp(`(?<![a-z])${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`);
    if (re.test(t)) found.push(place);
  }
  // keep longer matches, drop sub-matches
  return found.filter((p) => !found.some((q) => q !== p && q.includes(p) && q.length > p.length));
}

/** Geocode via offline gazetteer. Returns {lat,lng,source,approx}. */
export function geocodePlace(placeName) {
  if (!placeName) return null;
  const key = String(placeName).toLowerCase().trim();
  const direct = CHENNAI_GAZETTEER[key];
  if (direct) return { lat: direct[0], lng: direct[1], source: 'gazetteer', approx: false };
  const hit = Object.keys(CHENNAI_GAZETTEER).find((k) => key.includes(k) || k.includes(key));
  if (hit) return { lat: CHENNAI_GAZETTEER[hit][0], lng: CHENNAI_GAZETTEER[hit][1], source: 'gazetteer-fuzzy', approx: true };
  return { lat: CHENNAI_GAZETTEER['chennai'][0], lng: CHENNAI_GAZETTEER['chennai'][1], source: 'fallback-city-centre', approx: true };
}

/** Extract + geocode in one step. */
export function extractAndGeocode(text) {
  const places = extractLocations(text);
  if (places.length === 0) return { places: [], location: null };
  return { places, location: { name: places[0], ...geocodePlace(places[0]) } };
}
