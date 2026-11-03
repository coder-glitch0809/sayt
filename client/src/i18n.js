export const LANGS = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ru', short: 'RU', name: 'Русский' },
  { code: 'uz', short: 'UZ', name: "O'zbekcha" },
];

export const LANG_CODES = LANGS.map((l) => l.code);

const PREF_KEY = 'sr_lang';
export const langPref = {
  get: () => { try { return localStorage.getItem(PREF_KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(PREF_KEY, v); } catch { /* private mode */ } },
};

// "/" is the default language, every other one lives under "/ru", "/uz"…
export const pathFor = (code, defaultLang) => (code === defaultLang ? '/' : `/${code}`);
