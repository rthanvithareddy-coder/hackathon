# Listen to the City — AI-Powered Urban Mobility Intelligence

Hackathon prototype for **"Listen to the City — Collect, Analyse and Verify Urban Mobility
Information from Citizen Reports, News and Social Media"** focused on Chennai.

- Next.js 14 (App Router, JavaScript) + Leaflet/OpenStreetMap + Supabase PostgreSQL
- Zero paid APIs. Works fully offline with bundled demonstration data; Supabase is optional but recommended.

## 1. Install & run (Windows PowerShell, in your existing Next.js project)

```powershell
# from your project root
npm install @supabase/supabase-js leaflet react-leaflet
```

Copy the `app`, `components`, `lib`, `supabase` folders from this zip into your project root
(merge `app/layout.js` + `app/globals.css` with your existing ones — the topbar/footer markup and
the CSS variables are what this app needs). Then:

```powershell
Copy-Item .env.local.example .env.local
notepad .env.local      # paste your Supabase URL + keys (optional; demo mode works without)
npm run dev             # open http://localhost:3000
```

## 2. Supabase setup (optional but recommended)

1. Create a free project at https://supabase.com → wait for it to provision.
2. Dashboard → **SQL Editor** → New query → paste all of `supabase/schema.sql` → **Run**.
3. Dashboard → **Settings → API**: copy the Project URL, the `anon` key and the `service_role` key.
4. Put them into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe, RLS-protected)
   - `SUPABASE_SERVICE_ROLE_KEY` (**server-only**, used by `/api/seed`)
5. Restart `npm run dev`, then open `http://localhost:3000/api/seed` once to load the demo dataset.

## 3. API endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/reports` | GET | list all reports (Supabase or demo fallback) |
| `/api/reports` | POST | citizen report → full AI pipeline → DB |
| `/api/news` | GET | Google News RSS (server-side) + AI relevance, demo fallback |
| `/api/analyse` | POST | run pipeline on `{text}` / `{texts}` / `{records}` |
| `/api/analytics` | GET | aggregates for dashboard charts |
| `/api/incidents` | GET | map-ready incident markers |
| `/api/seed` | GET | idempotent demo-data seeding (service key, server-side) |

## 4. AI pipeline (6 algorithms, all explainable)

1. **Relevance** — weighted keyword baseline (0–100, reasons listed).
2. **Classification** — 7 classes via keyword-set voting + confidence.
3. **Location extraction** — Chennai gazetteer NER + offline geocoding (no API key).
4. **Duplicate detection** — TF-IDF + cosine similarity + location + time proximity clustering.
5. **Verification** — explainable weighted score. *Corroboration ≠ official confirmation:* the
   `officially_confirmed` status is only granted by an explicit authority flag.
6. **Severity** — low/medium/high with reason trail.

All AI outputs are labelled as estimates in the UI.

## 5. Test the modules

- Form: `#report` section — submit any Chennai traffic sentence, see instant AI analysis.
- Analyse API: `curl -X POST http://localhost:3000/api/analyse -H "Content-Type: application/json" -d "{\"text\":\"Heavy traffic near Tambaram\"}"`
- News: open the dashboard News section (live RSS or labelled fallback).
- Map: click any pin for details.

## 6. Troubleshooting

- **`window is not defined`** — map must stay behind `dynamic(..., { ssr: false })` (already done).
- **Supabase errors in console** — app auto-falls back to demo data; check `.env.local` spelling.
- **RSS empty** — network blocked; the News Monitor shows labelled demo headlines instead.
- **Port busy** — `npm run dev -- -p 3001`.
