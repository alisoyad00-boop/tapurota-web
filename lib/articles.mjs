/* Article veri normalize / slug / markdown helper'ları. */

const TR_MAP = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u' };

export function slugify(text) {
  return String(text || '')
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => TR_MAP[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const ARTICLE_CATEGORIES = [
  { key: 'arsa',      label: 'Arsa Yatırımı' },
  { key: 'tapu',      label: 'Tapu Rehberi' },
  { key: 'imar',      label: 'İmar Sorgulama' },
  { key: 'degerleme', label: 'Değerleme' },
  { key: 'bolge',     label: 'Bölge Analizi' },
];

export function categoryLabel(key) {
  return ARTICLE_CATEGORIES.find((c) => c.key === key)?.label || (key || '');
}

export function normalizeArticle(input) {
  return {
    category:      String(input.category || 'arsa').trim().toLowerCase(),
    title:         String(input.title || '').trim(),
    excerpt:       String(input.excerpt || '').trim() || null,
    body:          String(input.body || '').trim() || null,
    cover:         String(input.cover || '').trim() || null,
    read_minutes:  input.read_minutes === '' || input.read_minutes == null ? null : Number(input.read_minutes),
    featured:      !!input.featured,
    published:     input.published == null ? true : !!input.published,
  };
}

export function validateArticle(a) {
  const errors = [];
  if (!a.title) errors.push('Başlık zorunlu');
  if (!a.category) errors.push('Kategori zorunlu');
  return errors;
}

export function publicArticle(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    category_label: categoryLabel(row.category),
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    cover: row.cover,
    read_minutes: row.read_minutes,
    featured: !!row.featured,
    published: !!row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/* Basit Markdown → HTML çevirici.
 * Destekler: ## başlık, ### başlık, **bold**, *italic*, [link](url), satır arası paragraflar, - liste.
 * Tehlike: HTML escape edilir, sonra inline format uygulanır. */
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export function markdownToHtml(md) {
  if (!md) return '';
  const escaped = escHtml(md);
  const blocks = escaped.split(/\n\s*\n/);
  const out = blocks.map((block) => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    // Headings
    if (/^###\s+/.test(trimmed)) return `<h3>${inline(trimmed.replace(/^###\s+/, ''))}</h3>`;
    if (/^##\s+/.test(trimmed))  return `<h2>${inline(trimmed.replace(/^##\s+/, ''))}</h2>`;
    if (/^#\s+/.test(trimmed))   return `<h2>${inline(trimmed.replace(/^#\s+/, ''))}</h2>`;
    // Lists
    if (/^[-*]\s+/m.test(trimmed)) {
      const items = trimmed.split('\n').filter((l) => /^[-*]\s+/.test(l)).map((l) => `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`);
      return `<ul>${items.join('')}</ul>`;
    }
    // Paragraph (preserve single line breaks as <br>)
    return `<p>${inline(trimmed.replace(/\n/g, '<br/>'))}</p>`;
  });
  return out.filter(Boolean).join('\n');
}

function inline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
