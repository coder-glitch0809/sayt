import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, token } from '../api.js';
import { SECTIONS, syncSection } from './schema.js';
import { LANGS } from '../i18n.js';
import { Field, Fields } from './fields.jsx';
import { Messages, History, Security, Languages } from './pages.jsx';
import './admin.css';

function Login({ onOk }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { token: t } = await api('/api/login', { method: 'POST', body: { password: pw } });
      token.set(t);
      onOk();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  return (
    <div className="login">
      <form onSubmit={submit} className="login-box">
        <div className="logo">SR</div>
        <h1>Admin panel</h1>
        <p className="muted">Sayt kontentini boshqarish uchun parolni kiriting</p>
        <input type="password" autoFocus placeholder="Parol" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <button className="pbtn" disabled={busy || !pw}>{busy ? 'Tekshirilmoqda…' : 'Kirish'}</button>
        <a href="/" className="muted back">← Saytga qaytish</a>
      </form>
    </div>
  );
}

function useToasts() {
  const [list, setList] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random();
    setList((l) => [...l, { id, text, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);
  const view = <div className="toasts">{list.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>;
  return [push, view];
}

const EXTRA = [
  { key: '_langs', title: 'Tillar', icon: '🌐' },
  { key: '_messages', title: 'Xabarlar', icon: '✉' },
  { key: '_history', title: 'Tarix', icon: '↺' },
  { key: '_security', title: 'Xavfsizlik', icon: '⚿' },
];

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [content, setContent] = useState(null);
  const [saved, setSaved] = useState('');
  const [active, setActive] = useState(() => { try { return sessionStorage.getItem('sr_admin_tab') || 'hero'; } catch { return 'hero'; } });
  const [preview, setPreview] = useState(() => innerWidth > 1200);
  const [saving, setSaving] = useState(false);
  const [unread, setUnread] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [toast, toasts] = useToasts();
  const frame = useRef(null);

  const dirty = useMemo(() => content && JSON.stringify(content) !== saved, [content, saved]);

  useEffect(() => {
    if (!token.get()) return setAuthed(false);
    api('/api/me', { auth: true }).then(() => setAuthed(true)).catch(() => { token.clear(); setAuthed(false); });
  }, []);

  const loadAll = useCallback(async () => {
    const c = await api('/api/content');
    setContent(c);
    setSaved(JSON.stringify(c));
    setLang(c.defaultLang || 'en');
    api('/api/messages', { auth: true }).then((m) => setUnread(m.filter((x) => !x.read).length)).catch(() => {});
  }, []);

  useEffect(() => { if (authed) loadAll().catch((e) => toast(e.message, 'err')); }, [authed, loadAll, toast]);
  useEffect(() => { try { sessionStorage.setItem('sr_admin_tab', active); } catch { /* ignore */ } }, [active]);

  const save = useCallback(async () => {
    if (!content || saving) return;
    setSaving(true);
    try {
      await api('/api/content', { method: 'PUT', body: content, auth: true });
      setSaved(JSON.stringify(content));
      toast('Saqlandi — sayt yangilandi');
    } catch (e) {
      if (e.status === 401) { token.clear(); setAuthed(false); }
      toast(e.message, 'err');
    }
    setSaving(false);
  }, [content, saving, toast]);

  // Ctrl/Cmd+S saves; leaving with unsaved edits asks first
  useEffect(() => {
    const key = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } };
    const leave = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    addEventListener('keydown', key);
    addEventListener('beforeunload', leave);
    return () => { removeEventListener('keydown', key); removeEventListener('beforeunload', leave); };
  }, [save, dirty]);

  // live preview: push the draft into the iframe on every edit
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'preview-content', content, lang }, location.origin);
  }, [content, lang]);
  useEffect(() => { if (preview) send(); }, [preview, send]);
  useEffect(() => {
    const onMsg = (e) => { if (e.origin === location.origin && e.data?.type === 'preview-ready') send(); };
    addEventListener('message', onMsg);
    return () => removeEventListener('message', onMsg);
  }, [send]);

  if (authed === null) return <div className="admin-loading">Yuklanmoqda…</div>;
  if (!authed) return <Login onOk={() => setAuthed(true)} />;
  if (!content) return <div className="admin-loading">Kontent yuklanmoqda…</div>;

  const section = SECTIONS.find((s) => s.key === active);
  const logout = () => { token.clear(); setAuthed(false); };
  // edits go to the current language; shared fields (images, numbers, links) follow in the others
  const update = (key, v) => setContent((c) => {
    const old = c.locales[lang]?.[key];
    const locales = { ...c.locales, [lang]: { ...c.locales[lang], [key]: v } };
    for (const other of Object.keys(locales)) {
      if (other === lang) continue;
      locales[other] = { ...locales[other], [key]: syncSection(section, old, v, locales[other]?.[key]) };
    }
    return { ...c, locales };
  });
  const copyFrom = (from) => {
    if (!confirm(`"${section.title}" bo'limini ${from.toUpperCase()} tilidan nusxalaysizmi? Joriy tildagi matnlar almashtiriladi.`)) return;
    setContent((c) => ({ ...c, locales: { ...c.locales, [lang]: { ...c.locales[lang], [section.key]: structuredClone(c.locales[from][section.key]) } } }));
    toast(`${from.toUpperCase()} dan nusxalandi`);
  };
  const loc = content.locales[lang] || {};

  return (
    <div className={`admin${preview && section ? ' with-preview' : ''}${navOpen ? ' nav-open' : ''}`}>
      <aside className="side">
        <div className="side-head"><div className="logo sm">SR</div><div><b>Admin panel</b><small>{loc.nav?.name}</small></div></div>
        <p className="side-cap">Sahifa bo'limlari</p>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.key} className={active === s.key ? 'on' : ''} onClick={() => { setActive(s.key); setNavOpen(false); }}>
              <span className="si">{s.icon}</span>{s.title}
            </button>
          ))}
        </nav>
        <p className="side-cap">Boshqaruv</p>
        <nav>
          {EXTRA.map((s) => (
            <button key={s.key} className={active === s.key ? 'on' : ''} onClick={() => { setActive(s.key); setNavOpen(false); }}>
              <span className="si">{s.icon}</span>{s.title}
              {s.key === '_messages' && unread > 0 && <span className="badge">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="side-foot">
          <a href="/" target="_blank" rel="noopener">↗ Saytni ochish</a>
          <button onClick={logout}>Chiqish</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="ic burger-a" onClick={() => setNavOpen(!navOpen)} aria-label="Menyu">☰</button>
          <h2>{section?.title || EXTRA.find((x) => x.key === active)?.title}</h2>
          {section && (
            <div className="ltabs" role="tablist" aria-label="Til">
              {LANGS.map((l) => (
                <button key={l.code} role="tab" aria-selected={lang === l.code} onClick={() => setLang(l.code)}
                  className={content.languages.includes(l.code) ? '' : 'off'} title={l.name}>
                  {l.short}
                </button>
              ))}
            </div>
          )}
          <div className="top-actions">
            {section && (
              <button className={`tbtn${preview ? ' on' : ''}`} onClick={() => setPreview(!preview)} title="Jonli ko'rinish">
                ◫ <span>Ko'rinish</span>
              </button>
            )}
            {dirty && (
              <button className="tbtn" onClick={() => { setContent(JSON.parse(saved)); toast("O'zgarishlar bekor qilindi"); }}>
                Bekor qilish
              </button>
            )}
            <button className={`pbtn${dirty ? ' pulse' : ''}`} onClick={save} disabled={!dirty || saving}>
              {saving ? 'Saqlanmoqda…' : dirty ? 'Saqlash' : 'Saqlangan ✓'}
            </button>
          </div>
        </header>

        <div className="body">
          <div className="editor">
            {section && (
              <>
                <div className="lang-note">
                  <span><b>{LANGS.find((l) => l.code === lang)?.name}</b> tilidagi matnlar tahrirlanmoqda
                    {!content.languages.includes(lang) && <em> · bu til saytda o'chirilgan</em>}</span>
                  <span className="copy-from">
                    Nusxa olish:
                    {LANGS.filter((l) => l.code !== lang).map((l) => (
                      <button key={l.code} type="button" className="abtn ghost" onClick={() => copyFrom(l.code)}>{l.short}</button>
                    ))}
                  </span>
                </div>
                <div className="card">
                  {section.root
                    ? <Field f={section.root} value={loc[section.key]} onChange={(v) => update(section.key, v)} toast={toast} />
                    : <Fields fields={section.fields} value={loc[section.key]} onChange={(v) => update(section.key, v)} toast={toast} />}
                </div>
              </>
            )}
            {active === '_langs' && <Languages content={content} setContent={setContent} />}
            {active === '_messages' && <Messages toast={toast} onUnread={setUnread} />}
            {active === '_history' && <History toast={toast} onRestore={(c) => { setContent(c); setSaved(JSON.stringify(c)); }} />}
            {active === '_security' && <Security toast={toast} onLogout={logout} />}
          </div>
          {preview && section && (
            <div className="preview">
              <div className="preview-bar"><i /><i /><i /><span>Jonli ko'rinish · saqlanmagan o'zgarishlar ham ko'rinadi</span></div>
              <iframe ref={frame} src="/?preview" title="Preview" onLoad={send} />
            </div>
          )}
        </div>
      </div>
      {toasts}
    </div>
  );
}
