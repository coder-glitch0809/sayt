// VITE_API_URL lets the frontend live on a different host than the Node server
const BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'sr_admin_token';

export const asset = (url) => (url && /^\/(uploads|media)\//.test(url) ? BASE + url : url);

export const token = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* private mode */ } },
};

export async function api(path, { method = 'GET', body, auth = false, form } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token.get()) headers.Authorization = `Bearer ${token.get()}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Xatolik (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}
