/* TBD Competition Lab — Brief/Meeting shared UI script
   Handles: progress bar, sticky nav Focus Mode, back-to-top,
            mobile nav edge fades, footer page registry injection
   ============================================================ */

/* ── Page registry — add new files here ── */
const TBD_PAGES = [
  { href: 'Applicant_260529.html', label: '申請人說明包 · 2026.05.29' },
  { href: 'Applicant_260611.html', label: '申請人說明包 · 2026.06.11' },
  { href: 'Meeting_260611.html',   label: 'Kick-off · 2026.06.11' },
];

(function () {
  'use strict';

  /* ── Elements ── */
  const progress    = document.querySelector('.progress-bar');
  const backTop     = document.querySelector('.back-top');
  const mainEl      = document.querySelector('main.page');
  const navLinks    = [...document.querySelectorAll('.nav a')];
  const sections    = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const navContainer = document.querySelector('.sticky-nav .nav');
  const stickyNav   = document.querySelector('.sticky-nav');

  /* ── Focus Mode ── */
  if (mainEl) mainEl.classList.add('focus-mode-on');

  const ratios = new Map(sections.map(s => [s.id, 0]));
  let lastCurrent = null;

  function scrollActiveNavIntoView() {
    if (!navContainer) return;
    if (navContainer.scrollWidth <= navContainer.clientWidth + 2) return;
    const activeLink = navContainer.querySelector('a.active');
    if (!activeLink) return;
    const target = activeLink.offsetLeft - (navContainer.clientWidth - activeLink.offsetWidth) / 2;
    const left = Math.max(0, Math.min(navContainer.scrollWidth - navContainer.clientWidth, target));
    navContainer.scrollTo({ left, behavior: 'smooth' });
  }

  function updateNavEdges() {
    if (!navContainer || !stickyNav) return;
    if (navContainer.scrollWidth <= navContainer.clientWidth + 2) {
      stickyNav.classList.add('at-start', 'at-end');
      return;
    }
    stickyNav.classList.toggle('at-start', navContainer.scrollLeft <= 4);
    stickyNav.classList.toggle('at-end',
      navContainer.scrollLeft >= navContainer.scrollWidth - navContainer.clientWidth - 4);
  }

  function setFocusState(current) {
    sections.forEach(section => {
      const isActive = section.id === current;
      section.classList.toggle('is-active', isActive);
      section.classList.toggle('is-dimmed', !isActive);
      section.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    navLinks.forEach(a => {
      const id = a.getAttribute('href')?.replace('#', '');
      const isActive = id === current;
      const isInView = (ratios.get(id) || 0) > 0.08;
      a.classList.toggle('active', isActive);
      a.classList.toggle('in-view', isInView && !isActive);
      a.classList.toggle('is-dimmed', !isActive && !isInView);
      if (isActive) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (current !== lastCurrent) {
      lastCurrent = current;
      scrollActiveNavIntoView();
    }
  }

  function pickCurrentSection() {
    const focusY = window.innerHeight * 0.38;
    let best = sections[0]?.id, bestScore = -Infinity;
    for (const s of sections) {
      const rect = s.getBoundingClientRect();
      const score = (ratios.get(s.id) || 0) * 1000 - Math.abs(rect.top - focusY);
      if (score > bestScore) { bestScore = score; best = s.id; }
    }
    return best;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => ratios.set(e.target.id, e.intersectionRatio));
    setFocusState(pickCurrentSection());
  }, {
    threshold: [0, .05, .1, .18, .25, .35, .5, .65, .8, 1],
    rootMargin: '-12% 0px -42% 0px',
  });
  sections.forEach(s => observer.observe(s));

  /* ── Scroll / resize ── */
  function updateUI() {
    const doc = document.documentElement;
    const scrolled = doc.scrollTop || document.body.scrollTop;
    const max = doc.scrollHeight - doc.clientHeight;
    if (progress) progress.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
    if (backTop) backTop.classList.toggle('show', scrolled > 520);
    setFocusState(pickCurrentSection());
  }

  window.addEventListener('scroll', updateUI, { passive: true });
  window.addEventListener('resize', () => { updateUI(); updateNavEdges(); });
  if (navContainer) navContainer.addEventListener('scroll', updateNavEdges, { passive: true });

  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  updateUI();
  updateNavEdges();

  /* ── Footer page links injection ── */
  const footerEl = document.querySelector('.footer');
  if (footerEl && TBD_PAGES.length) {
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    const linkStyle = 'color:var(--muted-2);border-bottom:1px dotted var(--line);padding-bottom:1px;font-size:12px';
    const links = TBD_PAGES
      .filter(p => p.href !== currentFile)
      .map(p => `<a href="${p.href}" style="${linkStyle}">${p.label}</a>`)
      .join(' · ');
    if (links) {
      const nav = document.createElement('p');
      nav.style.cssText = 'margin-top:10px;font-size:12px;color:var(--muted)';
      nav.innerHTML = links;
      footerEl.appendChild(nav);
    }
  }

})();
