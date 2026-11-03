import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { LANGS } from '../i18n.js';

const fmtDate = (iso) => new Date(iso).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' });

// history ids look like 2026-10-18T09-30-12-345Z
const idToDate = (id) => {
  const m = id.match(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/);
  return m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`).toISOString() : null;
};

function replyLink(contact) {
  const c = contact.trim();
  if (/^\S+@\S+\.\S+$/.test(c)) return `mailto:${c}`;
  if (/^@?\w{4,}$/.test(c)) return `https://t.me/${c.replace(/^@/, '')}`;
  if (/^\+?[\d\s()-]{7,}$/.test(c)) return `https://wa.me/${c.replace(/\D/g, '')}`;
  return null;
}

export function Messages({ toast, onUnread }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    api('/api/messages', { auth: true }).then(setList).catch((e) => toast(e.message, 'err'));
  }, [toast]);
  useEffect(() => { if (list) onUnread(list.filter((m) => !m.read).length); }, [list, onUnread]);

  const mark = async (m, read) => {
    try {
      await api(`/api/messages/${m.id}`, { method: 'PATCH', body: { read }, auth: true });
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, read } : x)));
    } catch (e) { toast(e.message, 'err'); }
  };
  const del = async (m) => {
    if (!confirm("Xabarni o'chirasizmi?")) return;
    try {
      await api(`/api/messages/${m.id}`, { method: 'DELETE', auth: true });
      setList((l) => l.filter((x) => x.id !== m.id));
      toast("Xabar o'chirildi");
    } catch (e) { toast(e.message, 'err'); }
  };

  if (!list) return <p className="muted">Yuklanmoqda…</p>;
  if (!list.length) return <div className="card empty">Hozircha xabar yo'q. Saytdagi aloqa formasi orqali yuborilgan xabarlar shu yerda ko'rinadi.</div>;
  return (
    <div className="msgs">
      {list.map((m) => {
        const link = replyLink(m.contact);
        return (
          <div key={m.id} className={`card msg${m.read ? '' : ' unread'}`}>
            <div className="msg-head">
              <b>{m.name}</b>
              <span className="muted">{m.contact}</span>
              <span className="muted msg-date">{fmtDate(m.createdAt)}</span>
            </div>
            <p className="msg-text">{m.message}</p>
            <div className="msg-actions">
              {link && <a className="abtn" href={link} target="_blank" rel="noopener">Javob berish</a>}
              <button className="abtn ghost" onClick={() => mark(m, !m.read)}>{m.read ? "O'qilmagan qilish" : "O'qildi"}</button>
              <button className="abtn ghost danger" onClick={() => del(m)}>O'chirish</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function History({ toast, onRestore }) {
  const [list, setList] = useState(null);
  useEffect(() => {
    api('/api/history', { auth: true }).then(setList).catch((e) => toast(e.message, 'err'));
  }, [toast]);

  const restore = async (id) => {
    if (!confirm("Shu versiyani tiklaysizmi? Joriy kontent almashtiriladi.")) return;
    try {
      onRestore(await api(`/api/history/${id}/restore`, { method: 'POST', auth: true }));
      toast('Versiya tiklandi');
    } catch (e) { toast(e.message, 'err'); }
  };
  const reset = async () => {
    if (!confirm("Barcha kontent boshlang'ich holatga qaytariladi. Davom etasizmi?")) return;
    try {
      onRestore(await api('/api/reset', { method: 'POST', auth: true }));
      toast("Boshlang'ich kontent tiklandi");
    } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="card">
      <p className="muted" style={{ marginBottom: 16 }}>Har saqlashda oldingi versiya avtomatik saqlanadi (oxirgi 15 tasi).</p>
      {!list ? <p className="muted">Yuklanmoqda…</p> : !list.length ? <p className="muted">Hali saqlangan versiya yo'q.</p> : (
        <div className="hist">
          {list.map((h) => {
            const d = idToDate(h.id);
            return (
              <div key={h.id} className="hist-row">
                <span>{d ? fmtDate(d) : h.id}</span>
                <span className="muted">{(h.size / 1024).toFixed(1)} KB</span>
                <button className="abtn ghost" onClick={() => restore(h.id)}>Tiklash</button>
              </div>
            );
          })}
        </div>
      )}
      <hr />
      <button className="abtn ghost danger" onClick={reset}>Boshlang'ich kontentga qaytarish</button>
    </div>
  );
}

export function Security({ toast, onLogout }) {
  const [form, setForm] = useState({ current: '', next: '', again: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (form.next !== form.again) return toast('Yangi parollar mos emas', 'err');
    setBusy(true);
    try {
      await api('/api/password', { method: 'POST', body: { current: form.current, next: form.next }, auth: true });
      toast("Parol o'zgartirildi");
      setForm({ current: '', next: '', again: '' });
    } catch (e2) { toast(e2.message, 'err'); }
    setBusy(false);
  };
  return (
    <div className="card">
      <form className="fields" onSubmit={submit} style={{ maxWidth: 420 }}>
        <label className="f"><span className="f-label">Joriy parol</span><input type="password" value={form.current} onChange={set('current')} required /></label>
        <label className="f"><span className="f-label">Yangi parol (kamida 6 belgi)</span><input type="password" value={form.next} onChange={set('next')} required minLength={6} /></label>
        <label className="f"><span className="f-label">Yangi parolni takrorlang</span><input type="password" value={form.again} onChange={set('again')} required /></label>
        <div><button className="pbtn" disabled={busy}>{busy ? '…' : "Parolni o'zgartirish"}</button></div>
      </form>
      <hr />
      <button className="abtn ghost" onClick={onLogout}>Hisobdan chiqish</button>
    </div>
  );
}

export function Languages({ content, setContent }) {
  const enabled = content.languages;
  const toggle = (code) => {
    const next = enabled.includes(code) ? enabled.filter((l) => l !== code) : [...enabled, code];
    if (!next.length) return;
    setContent((c) => ({ ...c, languages: next, defaultLang: next.includes(c.defaultLang) ? c.defaultLang : next[0] }));
  };
  const setDefault = (code) => setContent((c) => ({ ...c, defaultLang: code, languages: c.languages.includes(code) ? c.languages : [...c.languages, code] }));
  return (
    <div className="card">
      <p className="muted" style={{ marginBottom: 18 }}>
        Saytda qaysi tillar ko'rinishini va asosiy tilni tanlang. Asosiy til <code>/</code> manzilida ochiladi,
        qolganlari <code>/ru</code>, <code>/uz</code> kabi manzillarda. O'zgarishlar "Saqlash" bosilganda kuchga kiradi.
      </p>
      <div className="langs">
        {LANGS.map((l) => (
          <div key={l.code} className="lang-row">
            <label className="f f-bool">
              <input type="checkbox" checked={enabled.includes(l.code)} onChange={() => toggle(l.code)} />
              <span className="switch" /> <span><b>{l.name}</b> <span className="muted mono">{l.code.toUpperCase()}</span></span>
            </label>
            <label className="radio">
              <input type="radio" name="deflang" checked={content.defaultLang === l.code} onChange={() => setDefault(l.code)} />
              Asosiy til
            </label>
            <a className="muted" href={l.code === content.defaultLang ? '/' : `/${l.code}`} target="_blank" rel="noopener">
              {l.code === content.defaultLang ? '/' : `/${l.code}`} ↗
            </a>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>
        "Barcha tillarda" belgili maydonlar (rasmlar, raqamlar, havolalar) bir tilda o'zgartirilsa, qolgan tillarda ham avtomatik yangilanadi.
        Element qo'shish, o'chirish va tartibini o'zgartirish ham barcha tillarga qo'llanadi — yangi elementning matnini har tilda tarjima qilib qo'ying.
      </p>
    </div>
  );
}
