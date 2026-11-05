// ============================================================
// lib/news.js — Server-side RSS fetcher (Google News RSS, free)
// NEVER imported from a client component — CORS/RSS requires server.
// Falls back to bundled demo headlines if the feed is unreachable.
// ============================================================

export const FEED_URL =
  'https://news.google.com/rss/search?q=chennai+traffic+OR+chennai+road+OR+chennai+accident&hl=en-IN&gl=IN&ceid=IN:en';

/** Minimal XML parsing with regex (no extra dependency needed). */
function parseRss(xml) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const pick = (block, tag) => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    if (!m) return '';
    return m[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  };
  let m;
  while ((m = itemRe.exec(xml)) && items.length < 20) {
    const block = m[1];
    const title = pick(block, 'title');
    const link = pick(block, 'link');
    const pubDate = pick(block, 'pubDate');
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    items.push({
      title,
      url: link,
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      source: sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'Google News',
    });
  }
  return items;
}

/** Bundled fallback headlines (used when the network/feed fails). */
export const DEMO_NEWS = [
  { title: 'Chennai traffic police announce diversion near Kathipara flyover this weekend for maintenance', url: 'https://news.google.com/demo/kathipara-diversion', published_at: new Date(Date.now() - 2 * 3600000).toISOString(), source: 'Demo News (feed offline)', category: 'road_construction' },
  { title: 'Heavy rain leaves stretches near Velachery waterlogged, corporation deploys pumps', url: 'https://news.google.com/demo/velachery-waterlog', published_at: new Date(Date.now() - 5 * 3600000).toISOString(), source: 'Demo News (feed offline)', category: 'waterlogging' },
  { title: 'Two injured after lorry collision on GST Road near Chromepet', url: 'https://news.google.com/demo/gst-accident', published_at: new Date(Date.now() - 8 * 3600000).toISOString(), source: 'Demo News (feed offline)', category: 'road_accident' },
  { title: 'New MTC bus route to connect Sholinganallur IT corridor with CMBT from next month', url: 'https://news.google.com/demo/mtc-route', published_at: new Date(Date.now() - 12 * 3600000).toISOString(), source: 'Demo News (feed offline)', category: 'public_transport_delay' },
  { title: 'Pothole repair drive announced for OMR service lanes after complaints', url: 'https://news.google.com/demo/omr-potholes', published_at: new Date(Date.now() - 20 * 3600000).toISOString(), source: 'Demo News (feed offline)', category: 'road_construction' },
];

export async function fetchTrafficNews() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(FEED_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ListenToTheCity/1.0 (+hackathon demo)' },
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`feed HTTP ${res.status}`);
    const xml = await res.text();
    const items = parseRss(xml);
    if (items.length === 0) throw new Error('feed returned 0 items');
    return { items, source: 'live_rss', ok: true };
  } catch (e) {
    console.error('[news] RSS fetch failed, using demo headlines:', e.message);
    return { items: DEMO_NEWS, source: 'demo_fallback', ok: false, error: e.message };
  }
}
