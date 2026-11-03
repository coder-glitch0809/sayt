/*
  Describes every editable part of the site. The admin form is generated from this,
  so adding a field here (and using it in the site component) is all a new setting needs.
  Field types: text | textarea | image | bool | number | list (string[]) | items (object[])
  shared: true → the value is the same in every language (images, numbers, links); editing it in
  one language updates the others. Adding, removing and reordering items is mirrored too.
*/
const HL = "Ajratib ko'rsatish uchun so'zni *yulduzcha* ichiga oling";
const kv = [{ k: 'value', t: 'text', label: 'Qiymat', shared: true }, { k: 'label', t: 'text', label: 'Izoh' }];

export const SECTIONS = [
  {
    key: 'hero', title: 'Bosh ekran', icon: '◎',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Yuqori kichik matn' },
      { k: 'line1', t: 'text', label: 'Sarlavha — 1-qator' },
      { k: 'line2', t: 'text', label: 'Sarlavha — 2-qator (yashil)' },
      { k: 'lede', t: 'textarea', label: 'Tavsif' },
      { k: 'ledeStrong', t: 'text', label: 'Tavsifdagi qalin matn' },
      { k: 'primaryLabel', t: 'text', label: 'Asosiy tugma matni', half: true },
      { k: 'primaryHref', t: 'text', label: 'Asosiy tugma havolasi', half: true, shared: true },
      { k: 'secondaryLabel', t: 'text', label: 'Ikkinchi tugma matni', half: true },
      { k: 'secondaryHref', t: 'text', label: 'Ikkinchi tugma havolasi', half: true, shared: true },
      { k: 'meta', t: 'list', label: 'Pastki belgilar' },
      { k: 'portrait', t: 'image', label: 'Portret rasmi', shared: true },
      { k: 'portraitAlt', t: 'text', label: 'Rasm tavsifi (alt)' },
      { k: 'readoutTitle', t: 'text', label: 'Kartochka sarlavhasi', half: true },
      { k: 'readoutTag', t: 'text', label: 'Kartochka tegi', half: true },
      { k: 'readout', t: 'items', label: 'Kartochka raqamlari', fields: kv, titleKey: 'label' },
    ],
  },
  { key: 'ticker', title: 'Yuguruvchi qator', icon: '≋', root: { t: 'list', label: "Yo'nalishlar (nishalar)" } },
  {
    key: 'stats', title: 'Statistika', icon: '#',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      {
        k: 'items', t: 'items', label: "Ko'rsatkichlar", titleKey: 'value',
        hint: "Raqamli qiymatlar (masalan $50K+) sahifada noldan sanab chiqadi",
        fields: [...kv, { k: 'highlight', t: 'bool', label: 'Yashil rangda', shared: true }],
      },
    ],
  },
  {
    key: 'cases', title: 'Keyslar', icon: '▤',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      { k: 'subtitle', t: 'textarea', label: 'Tavsif' },
      {
        k: 'items', t: 'items', label: 'Keyslar', titleKey: 'name',
        fields: [
          { k: 'category', t: 'text', label: 'Kategoriya', half: true },
          { k: 'name', t: 'text', label: 'Nomi', half: true },
          { k: 'bullets', t: 'list', label: 'Punktlar' },
          { k: 'roas', t: 'text', label: 'Katta raqam (ROAS)', half: true, shared: true },
          { k: 'roasLabel', t: 'text', label: 'Raqam izohi', half: true },
          { k: 'kv', t: 'items', label: "Ko'rsatkichlar", fields: kv, titleKey: 'label' },
        ],
      },
    ],
  },
  {
    key: 'chart', title: 'Grafik', icon: '▥',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      { k: 'max', t: 'number', label: "Shkala maksimumi ($)", shared: true },
      { k: 'note', t: 'textarea', label: 'Izoh' },
      {
        k: 'items', t: 'items', label: 'Ustunlar', titleKey: 'name',
        fields: [
          { k: 'name', t: 'text', label: 'Nomi', half: true },
          { k: 'sub', t: 'text', label: 'Pastki matn', half: true },
          { k: 'value', t: 'number', label: 'Qiymat', half: true, shared: true },
          { k: 'rangeTo', t: 'number', label: "Oraliq oxiri (0 = yo'q)", half: true, shared: true },
          { k: 'display', t: 'text', label: "Ko'rsatiladigan matn", shared: true },
        ],
      },
    ],
  },
  {
    key: 'proof', title: 'Isbotlar', icon: '▣',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      { k: 'subtitle', t: 'textarea', label: 'Tavsif' },
      { k: 'subtitleStrong', t: 'text', label: 'Tavsifdagi qalin matn' },
      {
        k: 'accounts', t: 'items', label: 'Akkauntlar (tablar)', titleKey: 'name',
        fields: [
          { k: 'name', t: 'text', label: 'Tab nomi', half: true },
          { k: 'caption', t: 'text', label: 'Oyna sarlavhasi', half: true },
          { k: 'image', t: 'image', label: 'Skrinshot', shared: true },
          { k: 'alt', t: 'text', label: 'Rasm tavsifi (alt)' },
          { k: 'summary', t: 'items', label: "Qisqa ko'rsatkichlar", fields: kv, titleKey: 'label' },
        ],
      },
    ],
  },
  {
    key: 'process', title: 'Jarayon', icon: '→',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      { k: 'steps', t: 'items', label: 'Bosqichlar', titleKey: 'title', fields: [{ k: 'title', t: 'text', label: 'Nomi' }, { k: 'text', t: 'textarea', label: 'Tavsif' }] },
    ],
  },
  {
    key: 'tools', title: 'Toolkit', icon: '⚒',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Sarlavha', hint: HL },
      { k: 'groups', t: 'items', label: 'Guruhlar', titleKey: 'title', fields: [{ k: 'title', t: 'text', label: 'Guruh nomi' }, { k: 'chips', t: 'list', label: 'Elementlar' }] },
    ],
  },
  {
    key: 'brands', title: 'Mijozlar', icon: '★',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'count', t: 'text', label: 'Raqam', half: true, shared: true },
      { k: 'title', t: 'text', label: 'Raqamdan keyingi matn', half: true },
      { k: 'subtitle', t: 'textarea', label: 'Tavsif' },
      { k: 'laneA', t: 'list', label: '1-qator brendlar', shared: true },
      { k: 'laneB', t: 'list', label: '2-qator brendlar', shared: true },
    ],
  },
  {
    key: 'band', title: 'Yashil blok', icon: '▬',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title', t: 'text', label: 'Katta sarlavha', hint: HL },
      { k: 'items', t: 'items', label: 'Ustunlar', titleKey: 'title', fields: [{ k: 'title', t: 'text', label: 'Sarlavha' }, { k: 'text', t: 'textarea', label: 'Matn' }] },
    ],
  },
  {
    key: 'contact', title: 'Aloqa', icon: '✉',
    fields: [
      { k: 'eyebrow', t: 'text', label: 'Kichik sarlavha' },
      { k: 'title1', t: 'text', label: 'Katta sarlavha — 1', half: true },
      { k: 'title2', t: 'text', label: 'Katta sarlavha — 2 (yashil)', half: true },
      { k: 'text', t: 'textarea', label: 'Matn' },
      {
        k: 'items', t: 'items', label: 'Aloqa qatorlari', titleKey: 'label',
        fields: [
          { k: 'label', t: 'text', label: 'Nomi', half: true },
          { k: 'value', t: 'text', label: 'Qiymat', half: true },
          { k: 'href', t: 'text', label: 'Havola (ixtiyoriy)', shared: true },
          { k: 'copy', t: 'bool', label: '"Nusxa" tugmasi', shared: true },
        ],
      },
      { k: 'formEnabled', t: 'bool', label: "Xabar formasini ko'rsatish", shared: true },
      { k: 'formTitle', t: 'text', label: 'Forma sarlavhasi', half: true },
      { k: 'formButton', t: 'text', label: 'Forma tugmasi', half: true },
      { k: 'formSuccess', t: 'text', label: 'Yuborilgandan keyingi matn' },
    ],
  },
  {
    key: 'nav', title: 'Menyu', icon: '☰',
    fields: [
      { k: 'initials', t: 'text', label: 'Logotip harflari', half: true, shared: true },
      { k: 'name', t: 'text', label: 'Ism', half: true },
      { k: 'links', t: 'items', label: 'Menyu havolalari', titleKey: 'label', fields: [{ k: 'label', t: 'text', label: 'Matn', half: true }, { k: 'href', t: 'text', label: 'Havola (#cases)', half: true, shared: true }] },
      { k: 'ctaLabel', t: 'text', label: 'Tugma matni', half: true },
      { k: 'ctaHref', t: 'text', label: 'Tugma havolasi', half: true, shared: true },
    ],
  },
  {
    key: 'footer', title: 'Pastki qism', icon: '▁',
    fields: [{ k: 'left', t: 'text', label: 'Chap matn' }, { k: 'right', t: 'text', label: "O'ng matn" }],
  },
  {
    key: 'ui', title: 'Interfeys matnlari', icon: 'Aa',
    fields: [
      { k: 'scroll', t: 'text', label: 'Pastga aylantirish belgisi', half: true },
      { k: 'step', t: 'text', label: `"Qadam" so'zi`, half: true },
      { k: 'copy', t: 'text', label: 'Nusxa tugmasi', half: true },
      { k: 'copied', t: 'text', label: 'Nusxalangandan keyin', half: true },
      { k: 'formName', t: 'text', label: 'Forma: ism', half: true },
      { k: 'formContact', t: 'text', label: 'Forma: aloqa', half: true },
      { k: 'formMessage', t: 'text', label: 'Forma: xabar', half: true },
      { k: 'toTop', t: 'text', label: 'Yuqoriga tugmasi', half: true },
      { k: 'menu', t: 'text', label: 'Menyu (mobil)', half: true },
    ],
  },
  {
    key: 'meta', title: 'SEO', icon: '⌕',
    fields: [{ k: 'title', t: 'text', label: 'Sahifa sarlavhasi (title)' }, { k: 'description', t: 'textarea', label: 'Tavsif (Google uchun)' }],
  },
];

/* a blank item shaped like the schema, used by "Qo'shish" */
export function blank(fields) {
  const o = {};
  for (const f of fields) o[f.k] = f.t === 'list' || f.t === 'items' ? [] : f.t === 'bool' ? false : f.t === 'number' ? 0 : '';
  return o;
}

/* ---------- cross-language sync of shared fields ---------- */
const clone = (v) => (v === undefined ? v : structuredClone(v));

function syncArr(fields, A, B, D) {
  if (A === B) return D;
  // untouched items keep their object identity, which tells us how items moved, were added or removed
  return B.map((b, j) => {
    let i = A.indexOf(b);
    if (i < 0 && A.length === B.length) i = j; // edited in place
    if (i < 0 || D[i] === undefined) return clone(b); // new item: start from the edited language's text
    return b === A[i] ? D[i] : syncObj(fields, A[i], b, D[i]);
  });
}

function syncObj(fields, oldV, newV, dst) {
  if (!dst || typeof dst !== 'object') return clone(newV);
  const out = { ...dst };
  for (const f of fields) {
    if (f.shared) out[f.k] = clone(newV?.[f.k]);
    else if (f.t === 'items') out[f.k] = syncArr(f.fields, oldV?.[f.k] || [], newV?.[f.k] || [], dst[f.k] || []);
  }
  return out;
}

/* returns the other language's section with shared values copied from the edited one */
export function syncSection(section, oldVal, newVal, otherVal) {
  if (section.root) return section.root.shared ? clone(newVal) : otherVal;
  return syncObj(section.fields, oldVal, newVal, otherVal);
}
