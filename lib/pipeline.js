// ============================================================
// lib/pipeline.js — End-to-end AI processing pipeline
// Collection → preprocessing → relevance → classification →
// location extraction → duplicate detection → confidence → store.
// ============================================================
import { detectRelevance, classifyIncident, classifySeverity } from './nlp/keywords';
import { extractAndGeocode, geocodePlace } from './nlp/geo';
import { findDuplicates } from './nlp/dedupe';
import { scoreVerification } from './nlp/verification';

/**
 * Process ONE raw record through relevance → classification →
 * location → geocoding. Returns an enriched record + audit trail.
 */
export function processRecord(raw) {
  const text = String(raw.description || raw.post_text || raw.title || '');
  const relevance = detectRelevance(text);
  let classification = { category: 'other', confidence: 0, scores: {} };
  let severity = { severity: 'low', reasons: [] };
  let geo = { places: [], location: raw.location_name ? { name: raw.location_name, ...geocodePlace(raw.location_name) } : null };

  if (relevance.relevant) {
    classification = classifyIncident(text);
    severity = classifySeverity(text, classification.category);
    const eg = extractAndGeocode(text);
    // explicit location field from the form wins over NER
    if (raw.location_name) {
      geo = { places: [raw.location_name.toLowerCase()], location: { name: raw.location_name, ...geocodePlace(raw.location_name) } };
    } else if (eg.location) {
      geo = eg;
    }
  }

  return {
    ...raw,
    description: text,
    relevant: relevance.relevant,
    relevance_score: relevance.score,
    relevance_reasons: relevance.reasons,
    category: relevance.relevant ? classification.category : 'other',
    category_confidence: classification.confidence,
    severity: relevance.relevant ? severity.severity : 'low',
    severity_reasons: severity.reasons,
    extracted_places: geo.places,
    location_name: geo.location?.name || raw.location_name || null,
    latitude: raw.latitude ?? geo.location?.lat ?? null,
    longitude: raw.longitude ?? geo.location?.lng ?? null,
    geocode_source: geo.location?.source || 'none',
    geocode_approx: geo.location?.approx ?? true,
    processed_at: new Date().toISOString(),
  };
}

/**
 * Full batch pipeline: process all records, then dedupe, then score.
 */
export function runPipeline(rawRecords, opts = {}) {
  const processed = rawRecords.map(processRecord);
  const dedupe = findDuplicates(processed);

  // group members by cluster for verification scoring
  const clusters = dedupe.clusters;
  const verificationByIndex = {};
  processed.forEach((_, i) => (verificationByIndex[i] = null));

  clusters.forEach((memberIdxs) => {
    if (memberIdxs.length === 0) return;
    const members = memberIdxs.map((i) => processed[i]);
    const v = scoreVerification(members, {
      officialConfirmation: members.some((m) => m.official_confirmation === true),
    });
    memberIdxs.forEach((i) => {
      processed[i].verification_status = v.status;
      processed[i].confidence = v.confidence;
      processed[i].verification_reasons = v.reasons;
      processed[i].duplicate_of =
        dedupe.duplicates.find((d) => String(d.b) === String(processed[i].id))?.merged_into || null;
    });
  });

  return {
    records: processed,
    duplicates: dedupe.duplicates,
    stats: {
      total: processed.length,
      relevant: processed.filter((r) => r.relevant).length,
      irrelevant: processed.filter((r) => !r.relevant).length,
      duplicates: dedupe.duplicate_count,
      corroborated: processed.filter((r) => r.verification_status === 'corroborated').length,
      official: processed.filter((r) => r.verification_status === 'officially_confirmed').length,
      unverified: processed.filter((r) => r.verification_status === 'unverified').length,
      rejected: processed.filter((r) => r.verification_status === 'rejected').length,
    },
  };
}
