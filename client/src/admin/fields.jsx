import { useRef, useState } from 'react';
import { api, asset } from '../api.js';
import { blank } from './schema.js';

export function Field({ f, value, onChange, toast }) {
  const label = (
    <span className="f-label">
      {f.label}
      {f.shared && <i className="shared-tag" title="Bu qiymat barcha tillarda bir xil">barcha tillarda</i>}
      {f.hint && <em>{f.hint}</em>}
    </span>
  );
  switch (f.t) {
    case 'textarea':
      return <label className="f">{label}<textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
    case 'number':
      return <label className={`f${f.half ? ' half' : ''}`}>{label}<input type="number" step="any" value={value ?? 0} onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></label>;
    case 'bool':
      return (
        <label className="f f-bool">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span className="switch" /> <span>{f.label}</span>
        </label>
      );
    case 'image':
      return <div className="f">{label}<ImageField value={value} onChange={onChange} toast={toast} /></div>;
    case 'list':
      return <div className="f">{label}<ListField value={value || []} onChange={onChange} /></div>;
    case 'items':
      return <div className="f">{label}<ItemsField f={f} value={value || []} onChange={onChange} toast={toast} /></div>;
    default:
      return <label className={`f${f.half ? ' half' : ''}`}>{label}<input value={value ?? ''} onChange={(e) => onChange(e.target.value)} /></label>;
  }
}

export function Fields({ fields, value, onChange, toast }) {
  return (
    <div className="fields">
      {fields.map((f) => (
        <Field key={f.k} f={f} value={value?.[f.k]} toast={toast} onChange={(v) => onChange({ ...value, [f.k]: v })} />
      ))}
    </div>
  );
}

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = arr.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

/* string[] as chips: Enter adds, × removes, click edits in place, arrows reorder */
export function ListField({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    onChange([...value, ...parts]);
    setDraft('');
  };
  return (
    <div className="list">
      {value.map((s, i) => (
        <div className="list-row" key={i}>
          <span className="list-n">{i + 1}</span>
          <input value={s} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="ic" title="Yuqoriga" onClick={() => onChange(move(value, i, -1))} disabled={i === 0}>↑</button>
          <button type="button" className="ic" title="Pastga" onClick={() => onChange(move(value, i, 1))} disabled={i === value.length - 1}>↓</button>
          <button type="button" className="ic del" title="O'chirish" onClick={() => onChange(value.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <div className="list-add">
        <input placeholder="Yangi qiymat va Enter…" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          onPaste={(e) => {
            // pasting several lines adds them all at once
            const t = e.clipboardData.getData('text');
            if (t.includes('\n')) { e.preventDefault(); onChange([...value, ...t.split('\n').map((s) => s.trim()).filter(Boolean)]); }
          }} />
        <button type="button" className="abtn" onClick={add}>+ Qo'shish</button>
      </div>
    </div>
  );
}

export function ItemsField({ f, value, onChange, toast }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => setOpen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  return (
    <div className="items">
      {value.map((item, i) => (
        <div className={`item${open.has(i) ? ' open' : ''}`} key={i}>
          <div className="item-head" onClick={() => toggle(i)}>
            <span className="caret">▸</span>
            <span className="item-title">{String(item?.[f.titleKey] ?? '') || `#${i + 1}`}</span>
            <span className="item-tools" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="ic" title="Yuqoriga" onClick={() => onChange(move(value, i, -1))} disabled={i === 0}>↑</button>
              <button type="button" className="ic" title="Pastga" onClick={() => onChange(move(value, i, 1))} disabled={i === value.length - 1}>↓</button>
              <button type="button" className="ic" title="Nusxa" onClick={() => onChange([...value.slice(0, i + 1), structuredClone(item), ...value.slice(i + 1)])}>⧉</button>
              <button type="button" className="ic del" title="O'chirish" onClick={() => { if (confirm("Ushbu elementni o'chirasizmi?")) onChange(value.filter((_, j) => j !== i)); }}>×</button>
            </span>
          </div>
          {open.has(i) && (
            <div className="item-body">
              <Fields fields={f.fields} value={item} toast={toast} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="abtn" onClick={() => { onChange([...value, blank(f.fields)]); setOpen((s) => new Set(s).add(value.length)); }}>
        + Qo'shish
      </button>
    </div>
  );
}

export function ImageField({ value, onChange, toast }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState(null);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { url } = await api('/api/upload', { method: 'POST', form, auth: true });
      onChange(url);
      toast('Rasm yuklandi');
    } catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  };

  const openLib = async () => {
    try { setLib(await api('/api/uploads', { auth: true })); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="img-field"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files[0]); }}>
      <div className="img-prev">{value ? <img src={asset(value)} alt="" /> : <span>Rasm yo'q</span>}</div>
      <div className="img-side">
        <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… yoki https://…" />
        <div className="img-btns">
          <button type="button" className="abtn" onClick={() => input.current.click()} disabled={busy}>{busy ? 'Yuklanmoqda…' : '⇪ Yuklash'}</button>
          <button type="button" className="abtn ghost" onClick={openLib}>Kutubxona</button>
        </div>
        <small>Rasmni shu yerga sudrab tashlashingiz ham mumkin · max 8 MB</small>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} />
      </div>
      {lib && (
        <div className="modal" onClick={() => setLib(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><b>Media kutubxona</b><button className="ic" onClick={() => setLib(null)}>×</button></div>
            <div className="lib-grid">
              {lib.map((m) => (
                <button key={m.url} type="button" className={m.url === value ? 'sel' : ''} onClick={() => { onChange(m.url); setLib(null); }}>
                  <img src={asset(m.url)} alt="" loading="lazy" />
                </button>
              ))}
              {!lib.length && <p className="muted">Hali rasm yuklanmagan</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
