/* Public articles loader — DB'den yazıları çeker. */

const ARROW = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;

/* Basit Markdown → HTML çevirici (browser-side). */
function escMd(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
function inlineMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
export function markdownToHtml(md) {
  if (!md) return '';
  const escaped = escMd(md);
  const blocks = escaped.split(/\n\s*\n/);
  const out = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (/^###\s+/.test(trimmed)) return `<h3>${inlineMd(trimmed.replace(/^###\s+/, ''))}</h3>`;
    if (/^##\s+/.test(trimmed))  return `<h2>${inlineMd(trimmed.replace(/^##\s+/, ''))}</h2>`;
    if (/^#\s+/.test(trimmed))   return `<h2>${inlineMd(trimmed.replace(/^#\s+/, ''))}</h2>`;
    if (/^[-*]\s+/m.test(trimmed)) {
      const items = trimmed.split('\n').filter((l) => /^[-*]\s+/.test(l)).map((l) => `<li>${inlineMd(l.replace(/^[-*]\s+/, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    return `<p>${inlineMd(trimmed.replace(/\n/g, '<br/>'))}</p>`;
  });
  return out.filter(Boolean).join('\n');
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function detailUrl(a) {
  return `makale-detay.html?id=${a.id}`;
}

function categoryShort(key) {
  return ({ arsa: 'Arsa Yatırımı', tapu: 'Tapu Rehberi', imar: 'İmar', degerleme: 'Değerleme', bolge: 'Bölge Analizi' })[key] || key;
}

function renderCard(a) {
  return `
    <a href="${detailUrl(a)}" class="article-card" data-filter-item="${esc(a.category)}">
      <div class="article-media">
        ${a.cover ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" />` : `<div style="background:#161310;width:100%;aspect-ratio:7/5"></div>`}
      </div>
      <div class="article-body">
        <div class="article-meta-row">
          <span>${esc(a.category_label || categoryShort(a.category))}</span>
          ${a.read_minutes ? `<span class="dot">·</span><span>${a.read_minutes} dk</span>` : ''}
        </div>
        <h4>${esc(a.title)}</h4>
        ${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ''}
      </div>
    </a>`;
}

function renderFeature(a) {
  return `
    <a href="${detailUrl(a)}" class="article-feature" style="text-decoration:none;">
      <div class="media">
        ${a.cover ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" />` : ''}
      </div>
      <div>
        <div class="meta-row">
          <span>Öne Çıkan</span>
          <span style="color:var(--text-ghost)">·</span>
          <span>${esc(a.category_label || categoryShort(a.category))}</span>
          ${a.read_minutes ? `<span style="color:var(--text-ghost)">·</span><span>${a.read_minutes} dk okuma</span>` : ''}
        </div>
        <h2>${esc(a.title)}</h2>
        ${a.excerpt ? `<p>${esc(a.excerpt)}</p>` : ''}
        <span class="property-link" style="display:inline-flex;">Yazının Tamamını Oku${ARROW}</span>
      </div>
    </a>`;
}

function emptyState(msg) {
  return `<div style="grid-column:1/-1;text-align:center;padding:80px 24px;color:var(--text-muted);">
    <p style="font-size:16px;">${esc(msg)}</p>
  </div>`;
}

export async function loadArticlesInto(selector, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">Yükleniyor…</div>';

  const params = new URLSearchParams();
  if (opts.featured) params.set('featured', '1');
  if (opts.category) params.set('category', opts.category);
  const qs = params.toString();

  try {
    const res = await fetch(`/api/articles${qs ? '?' + qs : ''}`);
    const data = await res.json();
    let list = data.articles || [];
    if (opts.skipId) list = list.filter((a) => a.id !== opts.skipId);
    if (opts.limit) list = list.slice(0, opts.limit);
    if (!list.length) {
      el.innerHTML = emptyState(opts.empty || 'Henüz yazı yok.');
      return;
    }
    el.innerHTML = list.map(renderCard).join('');

    const countEl = document.querySelector('[data-filter-count]');
    if (countEl) countEl.textContent = list.length;
  } catch (err) {
    el.innerHTML = emptyState('Yazılar yüklenemedi: ' + err.message);
  }
}

export async function loadFeaturedFeature(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  try {
    const res = await fetch('/api/articles?featured=1');
    const data = await res.json();
    const featured = (data.articles || [])[0];
    if (!featured) {
      el.style.display = 'none';
      return null;
    }
    el.outerHTML = renderFeature(featured);
    return featured;
  } catch {
    el.style.display = 'none';
    return null;
  }
}

export async function loadDetail() {
  const url = new URL(location.href);
  const id = url.searchParams.get('id') || url.searchParams.get('slug');
  if (!id) return null;
  try {
    const res = await fetch(`/api/articles/${encodeURIComponent(id)}`);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || 'Yazı bulunamadı');
    }
    const data = await res.json();
    return data.article;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export { esc, detailUrl, categoryShort, renderCard, renderFeature };
