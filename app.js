// Shared helpers: storage, auth, nav. Demo only (no backend).
const DB = {
  get(k, d = []) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const Auth = {
  user() { return DB.get('tn_user', null); },
  login(name, role) { DB.set('tn_user', { name: name.trim(), role }); },
  logout() { localStorage.removeItem('tn_user'); location.href = 'index.html'; },
  require(role) {
    const u = this.user();
    if (!u || (role && u.role !== role)) { location.href = 'index.html'; return null; }
    return u;
  }
};
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function roomName() {
  const a = new Uint8Array(8); crypto.getRandomValues(a);
  return 'AegisTelenutri-' + Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
function refreshIcons() { if (window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons(); }
function renderNav() {
  const u = Auth.user();
  const home = u ? (u.role === 'consumer' ? 'consumer.html' : 'provider.html') : 'index.html';
  document.getElementById('nav').innerHTML =
    `<a class="brand" href="${home}"><span class="brand-icon"><i data-lucide="shield-check"></i></span><span>Aegis <span class="brand-accent">Telenutri</span></span></a>` +
    (u ? `<div class="right"><span class="user-chip"><i data-lucide="user"></i> ${esc(u.name)} (${u.role})</span><button class="btn ghost" onclick="Auth.logout()"><i data-lucide="log-out"></i> Logout</button></div>` : '');
  refreshIcons();
}
document.addEventListener('DOMContentLoaded', renderNav);
 
// Project credits footer (shown on every page)
document.addEventListener('DOMContentLoaded', () => {
  const f = document.createElement('footer');
  f.innerHTML = '<strong>Aegis Telenutri</strong> &middot; Nutrition Fundamentals Finals Project<br>' +
    'By: Bancruz, Liboon, Navales, and Solis &middot; BSCS - 3';
  document.body.appendChild(f);
  refreshIcons();
});
 
// Non-blocking messages (replaces alert)
function toast(msg, type = 'info') {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}