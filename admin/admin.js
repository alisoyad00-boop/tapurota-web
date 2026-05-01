/* Ortak admin JS — auth check, fetch helper, toast. */

export async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function uploadFile(file) {
  const url = `/api/upload?filename=${encodeURIComponent(file.name)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Yükleme başarısız (${res.status})`);
  return data.url;
}

export async function deleteUploaded(blobUrl) {
  await fetch(`/api/upload?url=${encodeURIComponent(blobUrl)}`, { method: 'DELETE' });
}

export async function ensureAuth() {
  try {
    const me = await api('/api/auth/me');
    if (!me.user) {
      location.href = '/admin/login';
      return null;
    }
    return me.user;
  } catch {
    location.href = '/admin/login';
    return null;
  }
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function formatPrice(n) {
  if (n == null || n === '') return '—';
  return '₺ ' + Number(n).toLocaleString('tr-TR');
}

export function toast(message, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 14px 22px; border-radius: 10px; font-size: 14px; z-index: 9999;
    background: ${type === 'error' ? '#3a1a1a' : type === 'success' ? '#1a3a2a' : '#1f1a15'};
    color: ${type === 'error' ? '#ffaaaa' : type === 'success' ? '#aaffcc' : '#E8DFCE'};
    border: 1px solid ${type === 'error' ? '#5a2a2a' : type === 'success' ? '#2a5a3a' : '#3a2f25'};
    box-shadow: 0 12px 32px rgba(0,0,0,.5);
  `;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
