// Single service-worker registrar. Production only; never in Lovable preview/dev/iframe.
function refused() {
  if (!import.meta.env.PROD) return true;
  try { if (window.self !== window.top) return true; } catch { return true; }
  const h = window.location.hostname.toLowerCase();
  if (new URLSearchParams(window.location.search).get('sw') === 'off') return true;
  if (/\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(h)) {
    const label = h.split('.')[0];
    if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label)) return true;
    if (/^project--.+-dev$/.test(label)) return true;
  }
  if (h === 'lovableproject.com' || h.endsWith('.lovableproject.com')) return true;
  if (h === 'lovableproject-dev.com' || h.endsWith('.lovableproject-dev.com')) return true;
  if (h === 'beta.lovable.dev' || h.endsWith('.beta.lovable.dev')) return true;
  return false;
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (refused()) {
    navigator.serviceWorker.getRegistrations().then((rs) =>
      rs.forEach((r) => { if (r.active?.scriptURL.endsWith('/sw.js')) r.unregister(); }),
    ).catch(() => {});
    return;
  }
  navigator.serviceWorker.register('/sw.js').catch(() => console.warn('Offline app setup unavailable.'));
}
