'use strict';
/* ═══════════════════════════════════════════════════════
   Centru anvelope PNEUMATICA – script.js  |  Global JS
   ═══════════════════════════════════════════════════════ */

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


// ── 5. CONTACT FORM (contact.html only) ──────────────────────────────────────
const contactForm = document.getElementById('contact-form');
const formNote    = document.getElementById('form-note');

if (contactForm && formNote) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    const name  = contactForm.elements['name'].value.trim();
    const phone = contactForm.elements['phone'].value.trim();
    const email = contactForm.elements['email'] ? contactForm.elements['email'].value.trim() : '';

    if (!name) {
      showNote('Vă rugăm introduceți numele complet.', 'error');
      contactForm.elements['name'].focus();
      return;
    }
    if (!phone) {
      showNote('Vă rugăm introduceți numărul de telefon.', 'error');
      contactForm.elements['phone'].focus();
      return;
    }
    if (!/^[+\d][\d\s\-]{7,19}$/.test(phone)) {
      showNote('Numărul de telefon nu este valid.', 'error');
      contactForm.elements['phone'].focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNote('Adresa de email nu este validă.', 'error');
      contactForm.elements['email'].focus();
      return;
    }

    const btn = contactForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Se trimite…';
    formNote.textContent = '';

    // Simulated async submit – replace with real fetch() in production
    setTimeout(() => {
      showNote('✓ Mesajul a fost trimis! Vă vom contacta în curând.', 'success');
      contactForm.reset();
      btn.disabled = false;
      btn.textContent = 'Trimite Mesajul';
    }, 1400);
  });

  function showNote(msg, type) {
    formNote.textContent = msg;
    formNote.style.color = type === 'success' ? '#198754' : '#dc3545';
  }
}


// ── 6. IMAGE CAROUSELS (any page with a .js-carousel block) ──────────────────
document.querySelectorAll('.js-carousel').forEach(carousel => {
  const track   = carousel.querySelector('.carousel-track');
  const dotsBox = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-arrow-prev');
  const nextBtn = carousel.querySelector('.carousel-arrow-next');
  if (!track || !dotsBox || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  const parsedAutoplay = parseInt(carousel.dataset.autoplay, 10);
  const AUTOPLAY_MS = Number.isNaN(parsedAutoplay) ? 6000 : parsedAutoplay; // "0" must stay disabled, not fall back
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

statEls.forEach(el => counterObserver.observe(el));

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
