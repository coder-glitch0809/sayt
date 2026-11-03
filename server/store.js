/*
  Where the site's data lives.
  - MONGODB_URI set  → MongoDB (used on Render, whose free disk is wiped on every restart)
  - otherwise        → JSON files in server/data (local development)
  Both expose the same async API, so index.js never cares which one is active.
*/
import fs from 'node:fs';
import path from 'node:path';

const KEEP_HISTORY = 15;
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function fileStore(dir) {
  const history = path.join(dir, 'history');
  fs.mkdirSync(history, { recursive: true });
  const file = (name) => path.join(dir, `${name}.json`);
  const read = (name, fallback) => {
    try { return JSON.parse(fs.readFileSync(file(name), 'utf8')); } catch { return fallback; }
  };
  // write to a temp file first so a crash never leaves half-written JSON
  const write = (name, data) => {
    const tmp = `${file(name)}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file(name));
  };
  const messages = () => read('messages', []);

  return {
    kind: 'files',
    async getContent() { return read('content', null); },
    async saveContent(data, { snapshot = false } = {}) {
      if (snapshot && fs.existsSync(file('content'))) {
        fs.copyFileSync(file('content'), path.join(history, `${stamp()}.json`));
        fs.readdirSync(history).sort().reverse().slice(KEEP_HISTORY)
          .forEach((f) => fs.rmSync(path.join(history, f)));
      }
      write('content', data);
    },
    async listHistory() {
      return fs.readdirSync(history).filter((f) => f.endsWith('.json')).sort().reverse()
        .map((f) => ({ id: f.replace(/\.json$/, ''), size: fs.statSync(path.join(history, f)).size }));
    },
    async getHistory(id) {
      try { return JSON.parse(fs.readFileSync(path.join(history, `${path.basename(id)}.json`), 'utf8')); } catch { return null; }
    },
    async getAuth() { return read('auth', null); },
    async setAuth(auth) { write('auth', auth); },
    async listMessages() { return messages(); },
    async addMessage(msg) { write('messages', [msg, ...messages()].slice(0, 1000)); },
    async updateMessage(id, patch) {
      const list = messages();
      const m = list.find((x) => x.id === id);
      if (!m) return null;
      Object.assign(m, patch);
      write('messages', list);
      return m;
    },
    async deleteMessage(id) { write('messages', messages().filter((x) => x.id !== id)); },
  };
}

async function mongoStore(uri) {
  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'portfolio');
  const kv = db.collection('kv');
  const history = db.collection('history');
  const messages = db.collection('messages');
  const getKV = async (key) => (await kv.findOne({ _id: key }))?.value ?? null;
  const setKV = (key, value) => kv.updateOne({ _id: key }, { $set: { value } }, { upsert: true });
  const strip = ({ _id, ...rest }) => rest;

  return {
    kind: 'mongodb',
    getContent: () => getKV('content'),
    async saveContent(data, { snapshot = false } = {}) {
      if (snapshot) {
        const prev = await getKV('content');
        if (prev) {
          await history.insertOne({ _id: stamp(), data: prev, size: JSON.stringify(prev).length });
          const old = await history.find({}, { projection: { _id: 1 } }).sort({ _id: -1 }).skip(KEEP_HISTORY).toArray();
          if (old.length) await history.deleteMany({ _id: { $in: old.map((o) => o._id) } });
        }
      }
      await setKV('content', data);
    },
    async listHistory() {
      return (await history.find({}, { projection: { data: 0 } }).sort({ _id: -1 }).toArray())
        .map((h) => ({ id: h._id, size: h.size }));
    },
    async getHistory(id) { return (await history.findOne({ _id: String(id) }))?.data ?? null; },
    getAuth: () => getKV('auth'),
    setAuth: (auth) => setKV('auth', auth),
    async listMessages() { return (await messages.find().sort({ createdAt: -1 }).limit(1000).toArray()).map(strip); },
    async addMessage(msg) { await messages.insertOne({ _id: msg.id, ...msg }); },
    async updateMessage(id, patch) {
      const r = await messages.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' });
      const doc = r && 'value' in r ? r.value : r; // driver v5 wraps the doc, v6 returns it
      return doc ? strip(doc) : null;
    },
    async deleteMessage(id) { await messages.deleteOne({ _id: id }); },
  };
}

export async function createStore(dataDir) {
  if (process.env.MONGODB_URI) return mongoStore(process.env.MONGODB_URI);
  return fileStore(dataDir);
}
