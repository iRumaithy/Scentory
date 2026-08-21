import core from './index.js';

const PERFUMAPI_BASE = 'https://perfumapi-frontend.onrender.com';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let cacheSchemaReady = false;

function apiJson(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, max-age=60',
      ...headers,
    },
  });
}

function cleanText(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function cleanArray(value) {
  if (Array.isArray(value)) {
    return value.map(x => cleanText(x, 100)).filter(Boolean).slice(0, 30);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return cleanArray(parsed);
    } catch {}
    return s.split(',').map(x => cleanText(x, 100)).filter(Boolean).slice(0, 30);
  }
  return [];
}

function safeHttpsUrl(value) {
  try {
    const u = new URL(String(value || ''));
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

function safeRemoteId(value, index = 0) {
  const base = String(value || `item-${index}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 68);
  return `api-${base || `item-${index}`}`;
}

function normalizePerfume(p, index = 0) {
  const id = safeRemoteId(p?.id || p?.perfume_url || `${p?.brand}-${p?.name}`, index);
  const notesTop = cleanArray(p?.notes_top);
  const notesMiddle = cleanArray(p?.notes_middle);
  const notesBase = cleanArray(p?.notes_base);
  const rating = Number(p?.rating);
  const votes = Number(p?.votes);

  return {
    id,
    providerId: cleanText(p?.id, 100),
    name: cleanText(p?.name, 160) || 'Unknown perfume',
    brand: cleanText(p?.brand, 120) || 'Unknown brand',
    year: Number.isFinite(Number(p?.release_year)) ? Number(p.release_year) : null,
    gender: cleanText(p?.gender, 40),
    rating: Number.isFinite(rating) ? rating : null,
    votes: Number.isFinite(votes) ? votes : 0,
    image: safeHttpsUrl(p?.image_url) || 'assets/bottle-placeholder.svg',
    accords: {},
    notes: {
      top: notesTop,
      middle: notesMiddle,
      base: notesBase,
    },
    noteLabels: ['TOP NOTES', 'HEART NOTES', 'BASE NOTES'],
    tags: [cleanText(p?.gender, 40)].filter(Boolean),
    similar: [],
    description: cleanText(p?.description, 1200),
    longevity: cleanText(p?.longevity, 120),
    sillage: cleanText(p?.sillage, 120),
    source: 'PerfumAPI — experimental',
    sourceUrl: safeHttpsUrl(p?.perfume_url),
    provider: 'perfumapi',
    imageApproved: false,
    accordBasis: 'none',
  };
}

async function ensureCatalogCache(db) {
  if (cacheSchemaReady) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS catalog_provider_cache (
      cache_key TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      payload TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    )
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_catalog_provider_cache_fetched
    ON catalog_provider_cache(fetched_at)
  `).run();
  cacheSchemaReady = true;
}

async function getCached(db, key) {
  await ensureCatalogCache(db);
  return db.prepare(
    'SELECT payload, fetched_at FROM catalog_provider_cache WHERE cache_key = ? LIMIT 1'
  ).bind(key).first();
}

async function setCached(db, key, payload) {
  await ensureCatalogCache(db);
  await db.prepare(`
    INSERT INTO catalog_provider_cache (cache_key, provider, payload, fetched_at)
    VALUES (?, 'perfumapi', ?, ?)
    ON CONFLICT(cache_key)
    DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at
  `).bind(key, JSON.stringify(payload), Date.now()).run();
}

async function upstreamSearch(query, limit) {
  const url = `${PERFUMAPI_BASE}/perfumes/search/${encodeURIComponent(query)}?limit=${limit}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Scentory/0.5.0 experimental catalog adapter',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`UPSTREAM_${response.status}`);
  }

  const data = await response.json();
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.perfumes)
      ? data.perfumes
      : Array.isArray(data?.results)
        ? data.results
        : [];

  return raw.map(normalizePerfume).filter(x => x.name && x.brand);
}

async function handleCatalogSearch(request, env) {
  const url = new URL(request.url);
  const query = cleanText(url.searchParams.get('q'), 80);
  const limit = Math.min(30, Math.max(1, Number(url.searchParams.get('limit') || 20)));

  if (query.length < 2) {
    return apiJson({ items: [], experimental: true, provider: 'perfumapi' });
  }

  const key = `search:${query.toLocaleLowerCase('en-US')}:${limit}`;
  const cached = await getCached(env.DB, key);
  const age = cached ? Date.now() - Number(cached.fetched_at || 0) : Infinity;

  if (cached && age < CACHE_TTL_MS) {
    try {
      return apiJson({
        items: JSON.parse(cached.payload),
        cached: true,
        stale: false,
        experimental: true,
        provider: 'perfumapi',
      });
    } catch {}
  }

  try {
    const items = await upstreamSearch(query, limit);
    await setCached(env.DB, key, items);
    return apiJson({
      items,
      cached: false,
      stale: false,
      experimental: true,
      provider: 'perfumapi',
    });
  } catch (err) {
    if (cached) {
      try {
        return apiJson({
          items: JSON.parse(cached.payload),
          cached: true,
          stale: true,
          experimental: true,
          provider: 'perfumapi',
        });
      } catch {}
    }
    return apiJson({
      items: [],
      experimental: true,
      provider: 'perfumapi',
      error: 'تعذر الوصول إلى مصدر البحث التجريبي الآن',
    }, 502);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/catalog/search') {
      try {
        return await handleCatalogSearch(request, env);
      } catch (err) {
        console.error(JSON.stringify({
          event: 'catalog_adapter_error',
          message: err?.message || String(err),
        }));
        return apiJson({
          items: [],
          experimental: true,
          provider: 'perfumapi',
          error: 'حدث خطأ في محول قاعدة العطور',
        }, 500);
      }
    }

    return core.fetch(request, env, ctx);
  },
};
