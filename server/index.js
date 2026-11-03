import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './store.js';
import { createMedia } from './media.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(ROOT, 'uploads');
const CLIENT_DIST = path.join(ROOT, '..', 'client', 'dist');
// in dev the API always sits on API_PORT (5000) so a PORT meant for Vite can't steal it
const DEV = process.argv.includes('--dev');
const PORT = Number(DEV ? process.env.API_PORT : process.env.PORT) || 5000;

/* ---------- languages ---------- */
const LANGS = ['en', 'ru', 'uz'];
const seeds = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, 'seed', `${l}.json`), 'utf8'))]));
const freshSeed = () => structuredClone({ defaultLang: 'en', languages: [...LANGS], locales: seeds });

// accepts both the old single-language file and the multi-language one, and fills any gaps from the seed
function normalize(data) {
  if (!data || typeof data !== 'object') return freshSeed();
  const out = data.locales
    ? { ...data, locales: { ...data.locales } }
    : { defaultLang: 'en', languages: [...LANGS], locales: { en: data } };
  for (const l of LANGS) out.locales[l] = { ...structuredClone(seeds[l]), ...(out.locales[l] || {}) };
  out.languages = (Array.isArray(out.languages) ? out.languages : LANGS).filter((l) => LANGS.includes(l));
  if (!out.languages.length) out.languages = ['en'];
  if (!out.languages.includes(out.defaultLang)) out.defaultLang = out.languages[0];
  return out;
}

/* ---------- storage ---------- */
const store = await createStore(process.env.DATA_DIR || path.join(ROOT, 'data'));
const media = await createMedia(UPLOADS);
console.log(`Ma'lumotlar: ${store.kind}, rasmlar: ${media.kind}`);

await store.saveContent(normalize(await store.getContent()));

let auth = await store.getAuth();
if (!auth) {
  auth = {
    hash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10),
    secret: crypto.randomBytes(48).toString('hex'),
  };
  await store.setAuth(auth);
  console.log('Admin hisobi yaratildi. Parol: ADMIN_PASSWORD (standart: admin123)');
}
const JWT_SECRET = process.env.JWT_SECRET || auth.secret;

/* ---------- app ---------- */
const app = express();
app.set('trust proxy', 1); // behind Render's proxy: real client IPs for the rate limiter
const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: origins.length ? origins : true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(UPLOADS, { maxAge: '7d' }));
if (media.serve) app.get('/media/:id', (req, res, next) => media.serve(req, res).catch(next));

// async route errors land in the error handler instead of crashing the process
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Avtorizatsiya talab qilinadi' });
  }
};

// tiny in-memory limiter: N hits per window per IP
const limiter = (max, windowMs) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const rec = hits.get(req.ip) || { n: 0, t: now };
    if (now - rec.t > windowMs) { rec.n = 0; rec.t = now; }
    rec.n += 1;
    hits.set(req.ip, rec);
    if (rec.n > max) return res.status(429).json({ error: "Juda ko'p urinish. Birozdan so'ng qayta urining." });
    next();
  };
};

app.get('/api/health', (req, res) => res.json({ ok: true }));

/* auth */
app.post('/api/login', limiter(10, 15 * 60 * 1000), wrap(async (req, res) => {
  const { password } = req.body || {};
  if (!password || !(await bcrypt.compare(String(password), auth.hash))) {
    return res.status(401).json({ error: "Parol noto'g'ri" });
  }
  res.json({ token: jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' }) });
}));

app.get('/api/me', requireAuth, (req, res) => res.json({ ok: true }));

app.post('/api/password', requireAuth, wrap(async (req, res) => {
  const { current, next: nextPass } = req.body || {};
  if (!(await bcrypt.compare(String(current || ''), auth.hash))) {
    return res.status(400).json({ error: "Joriy parol noto'g'ri" });
  }
  if (!nextPass || String(nextPass).length < 6) {
    return res.status(400).json({ error: "Yangi parol kamida 6 belgidan iborat bo'lsin" });
  }
  auth = { ...auth, hash: await bcrypt.hash(String(nextPass), 10) };
  await store.setAuth(auth);
  res.json({ ok: true });
}));

/* content */
app.get('/api/content', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(normalize(await store.getContent()));
}));

app.put('/api/content', requireAuth, wrap(async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.locales !== 'object') {
    return res.status(400).json({ error: "Noto'g'ri ma'lumot" });
  }
  // the previous version goes to history so it can be restored from the admin panel
  await store.saveContent(normalize(body), { snapshot: true });
  res.json({ ok: true, savedAt: new Date().toISOString() });
}));

app.get('/api/history', requireAuth, wrap(async (req, res) => res.json(await store.listHistory())));

app.post('/api/history/:id/restore', requireAuth, wrap(async (req, res) => {
  const data = await store.getHistory(req.params.id);
  if (!data) return res.status(404).json({ error: 'Topilmadi' });
  const fixed = normalize(data);
  await store.saveContent(fixed);
  res.json(fixed);
}));

app.post('/api/reset', requireAuth, wrap(async (req, res) => {
  const seed = freshSeed();
  await store.saveContent(seed, { snapshot: true });
  res.json(seed);
}));

/* uploads */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(file.mimetype);
    cb(ok ? null : new Error('Faqat rasm fayllari qabul qilinadi'), ok);
  },
});

app.post('/api/upload', requireAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Fayl tanlanmagan' });
    media.save(req.file).then((url) => res.json({ url })).catch(next);
  });
});

app.get('/api/uploads', requireAuth, wrap(async (req, res) => res.json(await media.list())));

/* contact messages */
app.post('/api/messages', limiter(5, 10 * 60 * 1000), wrap(async (req, res) => {
  const { name, contact, message, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot field filled → bot, silently drop
  const clean = (v, max) => String(v || '').trim().slice(0, max);
  const msg = {
    id: crypto.randomUUID(),
    name: clean(name, 120),
    contact: clean(contact, 160),
    message: clean(message, 4000),
    createdAt: new Date().toISOString(),
    read: false,
  };
  if (!msg.name || !msg.contact || !msg.message) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
  }
  await store.addMessage(msg);
  res.json({ ok: true });
}));

app.get('/api/messages', requireAuth, wrap(async (req, res) => res.json(await store.listMessages())));

app.patch('/api/messages/:id', requireAuth, wrap(async (req, res) => {
  const m = await store.updateMessage(req.params.id, { read: Boolean(req.body?.read) });
  if (!m) return res.status(404).json({ error: 'Topilmadi' });
  res.json(m);
}));

app.delete('/api/messages/:id', requireAuth, wrap(async (req, res) => {
  await store.deleteMessage(req.params.id);
  res.json({ ok: true });
}));

/* production: serve the built React app */
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|uploads|media).*/, (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
