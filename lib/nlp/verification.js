// ============================================================
// lib/nlp/verification.js — Algorithm 5: Explainable confidence score
// ------------------------------------------------------------
// Weighted, explainable scoring. IMPORTANT INTEGRITY RULE:
// corroboration can raise confidence to "corroborated" but can
// NEVER produce "officially confirmed" — that status requires an
// explicit official_confirmation flag from an authority feed.
// ============================================================

export const VERIFICATION_STATUSES = ['unverified', 'corroborated', 'officially_confirmed', 'rejected'];

/**
 * Compute confidence for one incident cluster.
 * @param {Array} members  reports in the duplicate cluster
 * @param {Object} opts    { officialConfirmation: boolean }
 */
export function scoreVerification(members, opts = {}) {
  const reasons = [];
  if (!members || members.length === 0)
    return { confidence: 0, status: 'unverified', reasons: ['no reports'] };

  let score = 0;

  // 1. Independent reports (max 35 pts) — 15 for first, +8 each extra, cap 35
  const n = members.length;
  const repPts = Math.min(35, 15 + (n - 1) * 8);
  score += repPts;
  reasons.push(`independent reports: ${n} → +${repPts} pts`);

  // 2. Source diversity (max 20 pts) — citizen 6, news 8, social 4 each unique source type
  const sourceTypes = [...new Set(members.map((m) => m.source_type || 'citizen'))];
  const srcPts = Math.min(20, sourceTypes.length * 7);
  score += srcPts;
  reasons.push(`source types ${sourceTypes.join(', ')} → +${srcPts} pts`);

  // 3. Location agreement (max 15 pts)
  const locs = members.map((m) => (m.location_name || m.location || '').toLowerCase()).filter(Boolean);
  const uniqueLocs = [...new Set(locs)];
  const locPts = uniqueLocs.length === 1 && locs.length > 0 ? 15 : uniqueLocs.length ? 6 : 0;
  score += locPts;
  reasons.push(`location agreement (${uniqueLocs.length || 0} unique) → +${locPts} pts`);

  // 4. Time agreement (max 15 pts) — reports within 90 min of each other
  const times = members.map((m) => new Date(m.event_time || m.created_at || Date.now()).getTime());
  const spanH = (Math.max(...times) - Math.min(...times)) / 3600000;
  const timePts = spanH <= 1.5 ? 15 : spanH <= 6 ? 8 : 3;
  score += timePts;
  reasons.push(`time window ${spanH.toFixed(1)}h → +${timePts} pts`);

  // 5. Content similarity (max 15 pts) — average pairwise similarity proxy
  const textLens = members.map((m) => String(m.description || m.post_text || '').length);
  const avgLen = textLens.reduce((a, b) => a + b, 0) / (textLens.length || 1);
  const contentPts = avgLen > 40 ? 10 : 5;
  score += contentPts;
  reasons.push(`content detail → +${contentPts} pts`);

  const confidence = Math.max(0, Math.min(100, Math.round(score)));

  // 6. Official confirmation — ONLY from an explicit authority flag.
  const official = Boolean(opts.officialConfirmation);
  if (official) {
    reasons.push('official confirmation flag set by authority feed → status officially_confirmed');
    return { confidence, status: 'officially_confirmed', reasons };
  }
  reasons.push('no official confirmation — AI can never grant officially_confirmed');

  if (confidence >= 60 && n >= 2) return { confidence, status: 'corroborated', reasons };
  if (confidence < 25) return { confidence, status: 'rejected', reasons };
  return { confidence, status: 'unverified', reasons };
}
