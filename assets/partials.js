/* Shared header & footer injection — keeps nav consistent across pages */

const LOGO_SVG = `
<svg viewBox="0 0 200 200" class="nav-brand-mark" xmlns="http://www.w3.org/2000/svg" aria-label="TapuRota">
  <path d="M 100.0,6.0 L 110.7,18.7 L 124.3,9.2 L 131.4,24.2 L 147.0,18.6 L 149.9,34.9 L 166.5,33.5 L 165.1,50.1 L 181.4,53.0 L 175.8,68.6 L 190.8,75.7 L 181.3,89.3 L 194.0,100.0 L 181.3,110.7 L 190.8,124.3 L 175.8,131.4 L 181.4,147.0 L 165.1,149.9 L 166.5,166.5 L 149.9,165.1 L 147.0,181.4 L 131.4,175.8 L 124.3,190.8 L 110.7,181.3 L 100.0,194.0 L 89.3,181.3 L 75.7,190.8 L 68.6,175.8 L 53.0,181.4 L 50.1,165.1 L 33.5,166.5 L 34.9,149.9 L 18.6,147.0 L 24.2,131.4 L 9.2,124.3 L 18.7,110.7 L 6.0,100.0 L 18.7,89.3 L 9.2,75.7 L 24.2,68.6 L 18.6,53.0 L 34.9,50.1 L 33.5,33.5 L 50.1,34.9 L 53.0,18.6 L 68.6,24.2 L 75.7,9.2 L 89.3,18.7 Z" fill="#A87A2E"/>
  <circle cx="100" cy="100" r="74" fill="#FBF6E8"/>
  <circle cx="100" cy="100" r="68" fill="none" stroke="#A87A2E" stroke-width="2"/>
  <g transform="translate(100,82)">
    <path d="M -16,-3 L 0,-18 L 16,-3 L 16,12 L -16,12 Z"
          fill="#A87A2E"
          stroke="#A87A2E"
          stroke-width="1"
          stroke-linejoin="round"/>
    <circle cx="0" cy="3" r="5.5" fill="#FBF6E8" stroke="#7A5520" stroke-width="0.8"/>
    <path d="M 0,-1 L 2.2,3 L 0,7 L -2.2,3 Z" fill="#7A5520"/>
    <circle cx="0" cy="3" r="0.9" fill="#FBF6E8"/>
  </g>
  <text x="100" y="128" text-anchor="middle"
        font-family="Cormorant Garamond, Georgia, serif"
        font-size="19" font-weight="700"
        fill="#5A4520" letter-spacing="1.5">TAPUROTA</text>
</svg>`;

const NAV_HTML = (active) => `
<nav class="nav" id="site-nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-brand" aria-label="TapuRota — Anasayfa">
      ${LOGO_SVG}
      <span class="nav-brand-text">
        TapuRota
        <small>Doğru Yatırımın Rotası</small>
      </span>
    </a>
    <ul class="nav-links">
      <li><a href="index.html" class="${active==='home'?'active':''}">Anasayfa</a></li>
      <li><a href="hakkimizda.html" class="${active==='about'?'active':''}">Hakkımızda</a></li>
      <li><a href="gayrimenkuller.html" class="${active==='properties'?'active':''}">Gayrimenkuller</a></li>
      <li><a href="makaleler.html" class="${active==='articles'?'active':''}">Yatırım Rehberi</a></li>
      <li><a href="iletisim.html" class="${active==='contact'?'active':''}">İletişim</a></li>
    </ul>
    <a href="iletisim.html" class="nav-cta">
      Teklif Al
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    </a>
    <button class="nav-mobile-toggle" aria-label="Menüyü aç" aria-expanded="false" aria-controls="mobile-drawer"><span></span></button>
  </div>
</nav>

<div class="mobile-drawer-overlay" id="mobile-drawer-overlay" aria-hidden="true"></div>
<aside class="mobile-drawer" id="mobile-drawer" aria-hidden="true" aria-label="Mobil menü">
  <div class="mobile-drawer-head">
    <a href="index.html" class="nav-brand" aria-label="TapuRota">
      ${LOGO_SVG}
      <span class="nav-brand-text">
        TapuRota
        <small>Doğru Yatırımın Rotası</small>
      </span>
    </a>
    <button class="mobile-drawer-close" aria-label="Menüyü kapat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20"><path d="M6 6l12 12M18 6l-12 12"/></svg>
    </button>
  </div>

  <ul class="mobile-drawer-links">
    <li><a href="index.html" class="${active==='home'?'active':''}"><span class="num">01</span> Anasayfa</a></li>
    <li><a href="hakkimizda.html" class="${active==='about'?'active':''}"><span class="num">02</span> Hakkımızda</a></li>
    <li><a href="gayrimenkuller.html" class="${active==='properties'?'active':''}"><span class="num">03</span> Gayrimenkuller</a></li>
    <li><a href="makaleler.html" class="${active==='articles'?'active':''}"><span class="num">04</span> Yatırım Rehberi</a></li>
    <li><a href="iletisim.html" class="${active==='contact'?'active':''}"><span class="num">05</span> İletişim</a></li>
  </ul>

  <div class="mobile-drawer-cta">
    <a href="iletisim.html" class="btn btn-gold" style="width:100%; justify-content:center;">
      Teklif Al
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
    </a>
  </div>

  <div class="mobile-drawer-contact">
    <a href="tel:+905323307430" class="mobile-drawer-contact-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.8a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>
      <div>
        <div class="k">Telefon</div>
        <div class="v">+90 532 330 74 30</div>
      </div>
    </a>
    <a href="https://wa.me/905323307430" target="_blank" rel="noopener" class="mobile-drawer-contact-item">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4A11 11 0 0 0 4 19l-1 4 4-1a11 11 0 0 0 17-9.5A11 11 0 0 0 20 4zm-8 18a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 22z"/></svg>
      <div>
        <div class="k">WhatsApp</div>
        <div class="v">Hemen Yaz</div>
      </div>
    </a>
    <a href="mailto:info@tapurota.com" class="mobile-drawer-contact-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
      <div>
        <div class="k">E-Posta</div>
        <div class="v">info@tapurota.com</div>
      </div>
    </a>
  </div>
</aside>`;

const FOOTER_HTML = `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a href="index.html" class="nav-brand" aria-label="TapuRota">
        ${LOGO_SVG}
        <small class="nav-brand-tagline">Doğru Yatırımın Rotası</small>
      </a>
      <p style="margin-top:22px">
        Gayrimenkul sektöründe güven, şeffaflık ve sürdürülebilir değer anlayışıyla hizmet veren yatırım odaklı emlak platformu.
      </p>
      <div class="footer-socials">
        <a href="https://www.facebook.com/profile.php?id=61566461137587" target="_blank" rel="noopener" class="footer-social" aria-label="Facebook">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.5 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>
        </a>
        <a href="https://www.instagram.com/tapurota/" target="_blank" rel="noopener" class="footer-social" aria-label="Instagram">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
        <a href="https://wa.me/905323307430" target="_blank" rel="noopener" class="footer-social" aria-label="WhatsApp">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4A11 11 0 0 0 4 19l-1 4 4-1a11 11 0 0 0 17-9.5A11 11 0 0 0 20 4zm-8 18a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 22zm5-6.6c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.9 1-.3.2-.6 0a7.4 7.4 0 0 1-2.1-1.3 8 8 0 0 1-1.5-1.8c-.1-.3 0-.4.1-.5l.4-.5.2-.4v-.4l-.8-2c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3 1 2.6 1.1 2.7s1.9 2.9 4.6 4a14 14 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1c.5-.1 1.6-.7 1.8-1.3s.2-1.1.2-1.2-.3-.2-.6-.3z"/></svg>
        </a>
      </div>
    </div>

    <div class="footer-col">
      <h5>Keşfet</h5>
      <ul>
        <li><a href="index.html">Anasayfa</a></li>
        <li><a href="hakkimizda.html">Hakkımızda</a></li>
        <li><a href="gayrimenkuller.html">Gayrimenkuller</a></li>
        <li><a href="makaleler.html">Yatırım Rehberi</a></li>
        <li><a href="iletisim.html">İletişim</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h5>Kategoriler</h5>
      <ul>
        <li><a href="gayrimenkuller.html?kategori=arazi">Arazi</a></li>
        <li><a href="gayrimenkuller.html?kategori=konut">Konut</a></li>
        <li><a href="gayrimenkuller.html?kategori=bagevi">Bağevi</a></li>
        <li><a href="gayrimenkuller.html?kategori=ticari">Ticari</a></li>
      </ul>
    </div>

    <div class="footer-col">
      <h5>İletişim</h5>
      <ul>
        <li><a href="tel:+905323307430">+90 532 330 74 30</a></li>
        <li><a href="mailto:info@tapurota.com">info@tapurota.com</a></li>
        <li style="color:var(--text-subtle); font-size:13.5px;">Pazartesi – Cumartesi<br/>09:00 – 18:30</li>
      </ul>
    </div>
  </div>
  <div class="footer-base">
    <span>© <span id="yr"></span> TapuRota — Tüm hakları saklıdır.</span>
    <span>Gizlilik · KVKK · Çerez Politikası</span>
  </div>
</footer>`;

document.addEventListener('DOMContentLoaded', () => {
  const navMount = document.getElementById('nav-mount');
  const footerMount = document.getElementById('footer-mount');
  const active = document.body.dataset.page;

  if (navMount) navMount.outerHTML = NAV_HTML(active);
  if (footerMount) footerMount.outerHTML = FOOTER_HTML;

  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // Scrolled nav state
  const nav = document.getElementById('site-nav');
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile drawer
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('mobile-drawer-overlay');
  const toggle = document.querySelector('.nav-mobile-toggle');
  const close = document.querySelector('.mobile-drawer-close');

  const openDrawer = () => {
    if (!drawer) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle?.addEventListener('click', openDrawer);
  close?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  // Close drawer when navigating to an anchor on the same page
  drawer?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    setTimeout(closeDrawer, 80);
  }));

  // Filter tabs (properties page)
  document.querySelectorAll('[data-filter-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filterTab;
      document.querySelectorAll('[data-filter-tab]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('[data-filter-item]').forEach(card => {
        const cat = card.dataset.filterItem;
        card.style.display = (filter === 'all' || cat === filter) ? '' : 'none';
      });
      const visible = document.querySelectorAll('[data-filter-item]:not([style*="display: none"])').length;
      const count = document.querySelector('[data-filter-count]');
      if (count) count.textContent = visible;
    });
  });
});
