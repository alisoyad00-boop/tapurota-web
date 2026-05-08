/* Public site — DB'den ilanları çeker, mevcut card tasarımıyla render eder. */

const ARROW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;
const PIN   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function fmtPrice(n) {
  if (n == null || n === '') return '';
  return '₺ ' + Number(n).toLocaleString('tr-TR');
}

function detailUrl(p) {
  return `gayrimenkul-detay.html?id=${p.id}`;
}

const STATUS_LABELS = {
  'satisa-hazir': 'Satışa Hazır',
  'rezerve': 'Rezerve',
  'satildi': 'Satıldı',
};

function renderCard(p) {
  const cover = p.cover || (p.images && p.images[0]) || '';
  const metaEntries = Object.entries(p.meta || {}).slice(0, 3);
  // Hover slideshow için: kapak + diğer fotoğraflar (kapağı tekrar ekleme)
  const allImages = [cover, ...((p.images || []).filter((u) => u && u !== cover))].filter(Boolean);
  const status = p.status || 'satisa-hazir';
  const statusLabel = STATUS_LABELS[status] || 'Satışa Hazır';
  // "Satışa Hazır" varsayılan durum — pill göstermeye gerek yok (görsel kalabalık).
  // Sadece "Rezerve" veya "Satıldı" durumlarında pill çıkar.
  const showStatus = status !== 'satisa-hazir';
  return `
    <article class="property-card" data-filter-item="${esc(p.category)}" data-status="${esc(status)}">
      <div class="property-media">
        ${allImages.length ? `
          <div class="property-slides">
            ${allImages.map((u, i) => `<img src="${esc(u)}" alt="${i === 0 ? esc(p.title) : ''}" class="property-slide${i === 0 ? ' is-active' : ''}" loading="lazy" />`).join('')}
          </div>` : `<div style="background:#161310;width:100%;aspect-ratio:9/6.2"></div>`}
        ${showStatus ? `<span class="property-status property-status--${esc(status)}">${esc(statusLabel)}</span>` : ''}
        ${p.tag ? `<span class="property-tag">${esc(p.tag)}</span>` : ''}
        ${p.price ? `<span class="property-price">${esc(fmtPrice(p.price))}</span>` : ''}
        ${allImages.length > 1 ? `
          <div class="property-slide-dots" aria-hidden="true">
            ${allImages.map((_, i) => `<span class="property-slide-dot${i === 0 ? ' is-active' : ''}"></span>`).join('')}
          </div>` : ''}
      </div>
      <div class="property-body">
        <div class="property-loc">${PIN}${esc(p.location)}</div>
        <h3 class="h-card">${esc(p.title)}</h3>
        ${p.description ? `<p>${esc(p.description)}</p>` : ''}
        ${metaEntries.length ? `<div class="property-meta">${
          metaEntries.map(([k, v]) => `
            <div class="property-meta-item">
              <span class="key">${esc(k)}</span>
              <span class="val">${esc(v)}</span>
            </div>`).join('')
        }</div>` : ''}
        <a href="${detailUrl(p)}" class="property-link">Detayları İncele${ARROW}</a>
      </div>
    </article>`;
}

/* Hover slideshow: kart üstüne gelince fotoğraflar sırayla geçer.
   Touch cihazlarda mouseenter tetiklenmez — ilk fotoğraf kalır (doğru davranış). */
function bindHoverSlideshow(rootEl) {
  if (!rootEl) return;
  const cards = rootEl.querySelectorAll('.property-card');
  cards.forEach((card) => {
    const slides = card.querySelectorAll('.property-slide');
    const dots = card.querySelectorAll('.property-slide-dot');
    if (slides.length < 2) return;
    let idx = 0;
    let timer = null;
    const setActive = (n) => {
      slides[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('is-active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('is-active');
    };
    card.addEventListener('mouseenter', () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => setActive(idx + 1), 1300);
    });
    card.addEventListener('mouseleave', () => {
      if (timer) { clearInterval(timer); timer = null; }
      setActive(0); // başa dön
    });
  });
}

function emptyState(msg) {
  return `<div style="grid-column:1/-1;text-align:center;padding:80px 24px;color:var(--text-muted);">
    <p style="font-size:16px;">${esc(msg)}</p>
  </div>`;
}

/* Public API */

export async function loadPropertiesInto(selector, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">Yükleniyor…</div>';

  const params = new URLSearchParams();
  if (opts.featured) params.set('featured', '1');
  if (opts.category) params.set('category', opts.category);
  const qs = params.toString();

  try {
    const res = await fetch(`/api/properties${qs ? '?' + qs : ''}`);
    const data = await res.json();
    const list = data.properties || [];
    if (!list.length) {
      el.innerHTML = emptyState(opts.empty || 'Henüz ilan eklenmemiş.');
      return;
    }
    el.innerHTML = list.map(renderCard).join('');

    // Hover slideshow'u bağla
    bindHoverSlideshow(el);

    // Filter count update (gayrimenkuller sayfasındaki sayaç)
    const countEl = document.querySelector('[data-filter-count]');
    if (countEl) countEl.textContent = list.length;

    // Re-bind filter handlers (partials.js çoktan bağladı ama yeniden eklenen kartlar için tekrar tetikle)
    document.dispatchEvent(new CustomEvent('properties:loaded', { detail: { count: list.length } }));
  } catch (err) {
    el.innerHTML = emptyState('İlanlar yüklenemedi: ' + err.message);
  }
}

export async function loadDetail(target) {
  const url = new URL(location.href);
  const id = url.searchParams.get('id') || url.searchParams.get('slug');
  if (!id) {
    target.innerHTML = `<div style="padding:80px 24px;text-align:center;color:var(--text-muted);">İlan ID belirtilmemiş.</div>`;
    return null;
  }
  try {
    const res = await fetch(`/api/properties/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'İlan bulunamadı');
    }
    const data = await res.json();
    return data.property;
  } catch (err) {
    target.innerHTML = `<div style="padding:80px 24px;text-align:center;color:var(--text-muted);">${esc(err.message)}</div>`;
    return null;
  }
}

export { esc, fmtPrice, detailUrl, PIN, ARROW, CHECK, renderCard, bindHoverSlideshow };
