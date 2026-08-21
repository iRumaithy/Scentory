SCENTORY v0.5.0 — PerfumAPI experimental adapter

What this patch does
- Keeps your current Scentory catalog and UI.
- When a user types 3+ characters in search, Scentory searches its local catalog immediately.
- After ~550 ms it also calls /api/catalog/search on your own Cloudflare Worker.
- The Worker queries PerfumAPI, normalizes results, and caches searches in D1 for 24 hours.
- If PerfumAPI is temporarily unavailable, a stale cached result is used when available.
- Remote results are labeled LIVE • EXPERIMENTAL.
- No PerfumAPI scraping endpoints are called; this patch only uses its public read/search endpoint.
- Version shown in the footer becomes v0.5.0.

Upload/replace these files in the repository root:
1. src/index-v050.js               (new)
2. public/mobile-v041.js           (replace)
3. wrangler.jsonc                  (replace)

Do NOT delete src/index.js. index-v050.js imports it and delegates your existing auth/library/D1 routes to it.

Test after Cloudflare deploy:
- https://scentory.alromaithi-3bo0d.workers.dev/api/health
- Search in the website for a perfume not in your local 50, e.g. "Le Male" or "Eros".
- Direct adapter test:
  /api/catalog/search?q=Layton&limit=5

Important:
PerfumAPI's repository states it is for testing/educational use and its underlying dataset is scraped from Fragrantica. This integration is intentionally marked experimental and should not be treated as the final licensed production data source.
