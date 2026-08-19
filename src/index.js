const SESSION_COOKIE = 'scentory_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 365;
const PBKDF2_ITERATIONS = 180000;
const LISTS = new Set(['favorite', 'try', 'buy', 'owned']);

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`,
  `CREATE TABLE IF NOT EXISTS library_items (
    user_id TEXT NOT NULL,
    perfume_id TEXT NOT NULL,
    list_name TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, perfume_id, list_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS personal_reviews (
    user_id TEXT NOT NULL,
    perfume_id TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 0 CHECK(rating BETWEEN 0 AND 10),
    note TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, perfume_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`
];

function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

function error(message, status = 400) {
  return json({ error: message }, status);
}

async function ensureSchema(db) {
  await db.batch(schemaStatements.map(sql => db.prepare(sql)));
}

function normalizeUsername(value) {
  return String(value || '').normalize('NFKC').trim();
}

function usernameKey(value) {
  return normalizeUsername(value).toLocaleLowerCase('en-US');
}

function validUsername(value) {
  return /^[\p{L}\p{N}_.-]{3,40}$/u.test(value);
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function digestBase64Url(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function derivePassword(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: PBKDF2_ITERATIONS },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derivePassword(password, salt);
  return { salt: bytesToBase64(salt), hash: bytesToBase64(hash) };
}

async function verifyPassword(password, saltB64, expectedHashB64) {
  const actual = await derivePassword(password, base64ToBytes(saltB64));
  const expected = base64ToBytes(expectedHashB64);
  if (actual.byteLength !== expected.byteLength) {
    return !crypto.subtle.timingSafeEqual(actual, actual);
  }
  return crypto.subtle.timingSafeEqual(actual, expected);
}

function parseCookies(request) {
  const cookie = request.headers.get('Cookie') || '';
  return Object.fromEntries(cookie.split(';').map(part => {
    const idx = part.indexOf('=');
    return idx > -1 ? [part.slice(0, idx).trim(), decodeURIComponent(part.slice(idx + 1).trim())] : ['', ''];
  }).filter(([key]) => key));
}

function sessionCookie(token, maxAge = SESSION_TTL_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function createSession(db, userId) {
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = bytesToBase64Url(tokenBytes);
  const tokenHash = await digestBase64Url(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_SECONDS * 1000;
  await db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(tokenHash, userId, expiresAt, now).run();
  return { token, tokenHash, expiresAt };
}

async function getSession(request, db) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = await digestBase64Url(token);
  const row = await db.prepare(`SELECT s.token_hash, s.user_id, s.expires_at, u.username
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? LIMIT 1`).bind(tokenHash).first();
  if (!row) return null;
  if (Number(row.expires_at) <= Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
    return null;
  }
  return { ...row, token };
}

async function requireUser(request, db) {
  const session = await getSession(request, db);
  if (!session) return null;
  return { id: session.user_id, username: session.username, session };
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function bodyJson(request) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) throw new Error('INVALID_CONTENT_TYPE');
  return request.json();
}

function validPerfumeId(value) {
  return /^[a-z0-9-]{1,80}$/.test(String(value || ''));
}

async function handleRegister(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const body = await bodyJson(request);
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  if (!validUsername(username)) return error('اسم المستخدم يجب أن يكون 3–40 حرفًا ويحتوي حروفًا أو أرقامًا فقط مع . _ -');
  if (password.length < 8 || password.length > 128) return error('كلمة المرور يجب أن تكون بين 8 و128 حرفًا');
  const key = usernameKey(username);
  const exists = await env.DB.prepare('SELECT id FROM users WHERE username_key = ? LIMIT 1').bind(key).first();
  if (exists) return error('اسم المستخدم مستخدم بالفعل', 409);
  const userId = crypto.randomUUID();
  const passwordData = await hashPassword(password);
  const now = Date.now();
  try {
    await env.DB.prepare('INSERT INTO users (id, username, username_key, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, username, key, passwordData.hash, passwordData.salt, now).run();
  } catch (err) {
    console.warn(JSON.stringify({ event: 'register_conflict', username_key: key }));
    return error('اسم المستخدم مستخدم بالفعل', 409);
  }
  const session = await createSession(env.DB, userId);
  console.log(JSON.stringify({ event: 'register', user_id: userId }));
  return json({ user: { id: userId, username } }, 201, { 'Set-Cookie': sessionCookie(session.token) });
}

async function handleLogin(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const body = await bodyJson(request);
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  if (!username || !password) return error('أدخل اسم المستخدم وكلمة المرور');
  const user = await env.DB.prepare('SELECT id, username, password_hash, password_salt FROM users WHERE username_key = ? LIMIT 1')
    .bind(usernameKey(username)).first();
  const dummySalt = new Uint8Array(16);
  const dummyExpected = await derivePassword('dummy-password-value', dummySalt);
  let valid = false;
  if (user) {
    valid = await verifyPassword(password, user.password_salt, user.password_hash);
  } else {
    const attempted = await derivePassword(password, dummySalt);
    valid = attempted.byteLength === dummyExpected.byteLength && crypto.subtle.timingSafeEqual(attempted, dummyExpected) && false;
  }
  if (!valid) return error('اسم المستخدم أو كلمة المرور غير صحيحة', 401);
  const session = await createSession(env.DB, user.id);
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(user.id, Date.now()).run();
  console.log(JSON.stringify({ event: 'login', user_id: user.id }));
  return json({ user: { id: user.id, username: user.username } }, 200, { 'Set-Cookie': sessionCookie(session.token) });
}

async function handleMe(request, env) {
  const user = await requireUser(request, env.DB);
  if (!user) return json({ user: null });
  const newExpiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').bind(newExpiry, user.session.token_hash).run();
  return json({ user: { id: user.id, username: user.username } }, 200, { 'Set-Cookie': sessionCookie(user.session.token) });
}

async function handleLogout(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) {
    const tokenHash = await digestBase64Url(token);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

async function handleLibraryGet(request, env) {
  const user = await requireUser(request, env.DB);
  if (!user) return error('يجب تسجيل الدخول', 401);
  const [libraryResult, personalResult] = await Promise.all([
    env.DB.prepare('SELECT perfume_id, list_name FROM library_items WHERE user_id = ? ORDER BY updated_at DESC').bind(user.id).all(),
    env.DB.prepare('SELECT perfume_id, rating, note, updated_at FROM personal_reviews WHERE user_id = ?').bind(user.id).all(),
  ]);
  const lists = { favorite: [], try: [], buy: [], owned: [] };
  for (const row of libraryResult.results || []) if (lists[row.list_name]) lists[row.list_name].push(row.perfume_id);
  const personal = {};
  for (const row of personalResult.results || []) personal[row.perfume_id] = { rating: Number(row.rating), note: row.note || '', updatedAt: Number(row.updated_at) };
  return json({ lists, personal });
}

async function handleLibraryPost(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const user = await requireUser(request, env.DB);
  if (!user) return error('يجب تسجيل الدخول', 401);
  const body = await bodyJson(request);
  const perfumeId = String(body.perfume_id || '');
  const listName = String(body.list_name || '');
  if (!validPerfumeId(perfumeId) || !LISTS.has(listName)) return error('بيانات القائمة غير صالحة');
  if (body.active) {
    await env.DB.prepare(`INSERT INTO library_items (user_id, perfume_id, list_name, updated_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, perfume_id, list_name) DO UPDATE SET updated_at = excluded.updated_at`)
      .bind(user.id, perfumeId, listName, Date.now()).run();
  } else {
    await env.DB.prepare('DELETE FROM library_items WHERE user_id = ? AND perfume_id = ? AND list_name = ?')
      .bind(user.id, perfumeId, listName).run();
  }
  return json({ ok: true });
}

async function handlePersonalPost(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const user = await requireUser(request, env.DB);
  if (!user) return error('يجب تسجيل الدخول', 401);
  const body = await bodyJson(request);
  const perfumeId = String(body.perfume_id || '');
  const rating = Number(body.rating || 0);
  const note = String(body.note || '').trim().slice(0, 1000);
  if (!validPerfumeId(perfumeId) || !Number.isInteger(rating) || rating < 0 || rating > 10) return error('بيانات التقييم غير صالحة');
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO personal_reviews (user_id, perfume_id, rating, note, updated_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, perfume_id) DO UPDATE SET rating = excluded.rating, note = excluded.note, updated_at = excluded.updated_at`)
    .bind(user.id, perfumeId, rating, note, now).run();
  return json({ ok: true, updatedAt: now });
}

async function handleImport(request, env) {
  if (!sameOrigin(request)) return error('طلب غير مسموح', 403);
  const user = await requireUser(request, env.DB);
  if (!user) return error('يجب تسجيل الدخول', 401);
  const body = await bodyJson(request);
  const statements = [];
  const lists = body.lists || {};
  for (const listName of LISTS) {
    const ids = Array.isArray(lists[listName]) ? lists[listName].slice(0, 500) : [];
    for (const perfumeId of ids) {
      if (!validPerfumeId(perfumeId)) continue;
      statements.push(env.DB.prepare(`INSERT INTO library_items (user_id, perfume_id, list_name, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, perfume_id, list_name) DO NOTHING`).bind(user.id, perfumeId, listName, Date.now()));
    }
  }
  const personal = body.personal && typeof body.personal === 'object' ? body.personal : {};
  for (const [perfumeId, review] of Object.entries(personal).slice(0, 500)) {
    if (!validPerfumeId(perfumeId)) continue;
    const rating = Number(review?.rating || 0);
    if (!Number.isInteger(rating) || rating < 0 || rating > 10) continue;
    const note = String(review?.note || '').trim().slice(0, 1000);
    statements.push(env.DB.prepare(`INSERT INTO personal_reviews (user_id, perfume_id, rating, note, updated_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, perfume_id) DO NOTHING`).bind(user.id, perfumeId, rating, note, Date.now()));
  }
  if (statements.length) {
    for (let i = 0; i < statements.length; i += 100) await env.DB.batch(statements.slice(i, i + 100));
  }
  return json({ ok: true });
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
  await ensureSchema(env.DB);
  if (request.method === 'GET' && path === '/api/health') return json({ ok: true, database: 'ready' });
  if (request.method === 'POST' && path === '/api/auth/register') return handleRegister(request, env);
  if (request.method === 'POST' && path === '/api/auth/login') return handleLogin(request, env);
  if (request.method === 'POST' && path === '/api/auth/logout') return handleLogout(request, env);
  if (request.method === 'GET' && path === '/api/auth/me') return handleMe(request, env);
  if (request.method === 'GET' && path === '/api/library') return handleLibraryGet(request, env);
  if (request.method === 'POST' && path === '/api/library') return handleLibraryPost(request, env);
  if (request.method === 'POST' && path === '/api/personal') return handlePersonalPost(request, env);
  if (request.method === 'POST' && path === '/api/import') return handleImport(request, env);
  return error('المسار غير موجود', 404);
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      console.error(JSON.stringify({ event: 'request_error', path: new URL(request.url).pathname, message: err?.message || String(err) }));
      if (err?.message === 'INVALID_CONTENT_TYPE') return error('يجب إرسال JSON', 415);
      return error('حدث خطأ في الخادم', 500);
    }
  },
};
