'use strict';
/* ═══════════════════════════════════════════════════════
   Centru anvelope PNEUMATICA – script.js  |  Global JS
   ═══════════════════════════════════════════════════════ */

// Visitors who asked their OS/browser for reduced motion get no autoplay or counting animations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── 1. HAMBURGER MENU ────────────────────────────────────────────────────────
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

function closeMenu() {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Deschide meniu');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Închide meniu' : 'Deschide meniu');
  document.body.style.overflow = open ? 'hidden' : '';
});

// Close on any nav link click
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// Close on click outside
document.addEventListener('click', e => {
  if (
    navLinks.classList.contains('open') &&
    !navLinks.contains(e.target) &&
    !hamburger.contains(e.target)
  ) closeMenu();
});

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
});


// ── 2. NAVBAR SCROLL SHADOW ───────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });


// ── 3. ACTIVE NAV LINK (based on current page filename) ──────────────────────
(function setActiveLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle(
      'active',
      href === page || (page === '' && href === 'index.html')
    );
  });
})();


// ── 4. SCROLL REVEAL (IntersectionObserver) ───────────────────────────────────
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


// ── 5. COOKIE CONSENT (gates third-party embeds, e.g. Google Maps) ───────────
(function cookieConsent() {
  const KEY = 'pneumatica-cookie-consent';   // 'accepted' | 'rejected'

  const read = () => {
    try { return localStorage.getItem(KEY); } catch (_) { return null; }
  };
  const write = value => {
    try { localStorage.setItem(KEY, value); } catch (_) { /* storage blocked: choice lasts for this page view only */ }
  };

  const mapFrame   = document.querySelector('iframe[data-src]');
  const mapConsent = document.getElementById('map-consent');

  function applyConsent(value) {
    if (!mapFrame) return;
    if (value === 'accepted') {
      if (!mapFrame.getAttribute('src')) mapFrame.setAttribute('src', mapFrame.dataset.src);
      if (mapConsent) mapConsent.hidden = true;
    } else {
      // Withdrawn or declined: unload the embed so Google stops receiving requests
      mapFrame.removeAttribute('src');
      if (mapConsent) mapConsent.hidden = false;
    }
  }

  let banner = null;

  function closeBanner() {
    if (!banner) return;
    banner.classList.remove('visible');
    const old = banner;
    banner = null;
    setTimeout(() => old.remove(), 400);
  }

  function choose(value) {
    write(value);
    applyConsent(value);
    closeBanner();
  }

  function openBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Setări cookie-uri');
    banner.innerHTML =
      '<div class="cookie-banner-text">' +
        '<strong>Cookie-uri și servicii externe</strong>' +
        '<p>Site-ul nu folosește cookie-uri de analiză sau publicitate. Singurul serviciu care poate seta cookie-uri este harta Google de pe pagina Contact, pe care o afișăm doar cu acordul tău. ' +
        'Detalii în <a href="politica-confidentialitate.html#cookies">Politica de Confidențialitate</a>.</p>' +
      '</div>' +
      '<div class="cookie-banner-actions">' +
        '<button type="button" class="btn-secondary" data-consent="rejected">Refuz</button>' +
        '<button type="button" class="btn-primary" data-consent="accepted">Accept</button>' +
      '</div>';
    banner.querySelectorAll('[data-consent]').forEach(btn =>
      btn.addEventListener('click', () => choose(btn.dataset.consent))
    );
    document.body.appendChild(banner);
    requestAnimationFrame(() => requestAnimationFrame(() => banner && banner.classList.add('visible')));
  }

  // Initial state: only pages with the map ask up front; elsewhere the footer link still opens the banner
  const saved = read();
  applyConsent(saved);
  if (!saved && mapFrame) openBanner();

  // "Acceptă și afișează harta" button inside the map placeholder
  document.querySelectorAll('[data-map-accept]').forEach(btn =>
    btn.addEventListener('click', () => choose('accepted'))
  );

  // Footer "Setări cookie-uri" link reopens the banner so the choice can be changed
  document.querySelectorAll('[data-cookie-settings]').forEach(btn =>
    btn.addEventListener('click', openBanner)
  );
})();


// ── 6. IMAGE CAROUSELS (any page with a .js-carousel block) ──────────────────
document.querySelectorAll('.js-carousel').forEach(carousel => {
  const track   = carousel.querySelector('.carousel-track');
  const dotsBox = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-arrow-prev');
  const nextBtn = carousel.querySelector('.carousel-arrow-next');
  if (!track || !dotsBox || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  const parsedAutoplay = parseInt(carousel.dataset.autoplay, 10);
  const AUTOPLAY_MS = prefersReducedMotion ? 0 : (Number.isNaN(parsedAutoplay) ? 6000 : parsedAutoplay); // "0" must stay disabled, not fall back
  let current = 0;
  let autoplayId = null;

  // Build pagination dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Mergi la imaginea ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
  });
  const dots = Array.from(dotsBox.children);

  function render() {
    // Clamp so the last group of visible slides stays flush, no overshoot/empty gap
    const maxOffset = Math.max(0, track.scrollWidth - track.clientWidth);
    const offset = Math.min(slides[current] ? slides[current].offsetLeft : 0, maxOffset);
    track.style.transform = `translateX(-${offset}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    render();
    restartAutoplay();
  }

  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  function startAutoplay() { if (AUTOPLAY_MS > 0) autoplayId = setInterval(next, AUTOPLAY_MS); }
  function restartAutoplay() { clearInterval(autoplayId); startAutoplay(); }

  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  carousel.addEventListener('mouseenter', () => clearInterval(autoplayId));
  carousel.addEventListener('mouseleave', () => { if (AUTOPLAY_MS > 0) startAutoplay(); });
  carousel.addEventListener('focusin', () => clearInterval(autoplayId));
  carousel.addEventListener('focusout', () => { if (AUTOPLAY_MS > 0) startAutoplay(); });

  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Touch swipe support
  let touchStartX = null;
  track.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) (diff < 0 ? next() : prev());
    touchStartX = null;
  }, { passive: true });

  // Re-align on viewport resize (visible-slide count can change via CSS breakpoints)
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 150);
  });

  render();
  startAutoplay();
});


// ── 7. STAT COUNTER ANIMATION ─────────────────────────────────────────────────
const statEls = document.querySelectorAll('.stat-num, .stat-item .num');

const counterObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

if (!prefersReducedMotion) statEls.forEach(el => counterObserver.observe(el));

function animateCount(el) {
  const raw     = el.textContent;
  const numStr  = raw.replace(/[\s+%\u00a0]/g, '');
  const target  = parseInt(numStr, 10);
  if (isNaN(target)) return;
  const suffix  = raw.replace(/[\d\s]/g, '');
  const steps   = 48;
  const dur     = 1300;
  let   step    = 0;

  const interval = setInterval(() => {
    step++;
    const val = Math.min(Math.round((target / steps) * step), target);
    el.textContent = val.toLocaleString('ro-RO').replace(/\./g, '\u00a0') + suffix;
    if (step >= steps) clearInterval(interval);
  }, dur / steps);
}
