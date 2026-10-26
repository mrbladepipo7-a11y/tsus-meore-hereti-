(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // Mobile menu
  const menuToggle = $('#menuToggle');
  const mobileMenu = $('#mobileMenu');
  function closeMenu() {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'მენიუს გახსნა');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
  }
  menuToggle.addEventListener('click', () => {
    const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'მენიუს დახურვა' : 'მენიუს გახსნა');
    mobileMenu.classList.toggle('open', opening);
    mobileMenu.setAttribute('aria-hidden', String(!opening));
    document.body.classList.toggle('menu-open', opening);
  });
  $$('.mobile-menu a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); closeModal(); } });

  // Scroll progress
  const progress = $('#readingProgress');
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // Reveal animations: stagger sibling items lightly and respect reduced motion
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    $$('.reveal').forEach((el, index) => {
      el.style.transitionDelay = `${Math.min((index % 4) * 55, 165)}ms`;
      observer.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Subtle parallax on the hero art, disabled for touch/reduced-motion
  const heroArt = $('.hero-art');
  if (heroArt && !reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', event => {
      const x = (event.clientX / window.innerWidth - .5) * 9;
      const y = (event.clientY / window.innerHeight - .5) * 7;
      heroArt.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
  }

  // Modal details for heritage cards
  const modal = $('#detailModal');
  const modalTitle = $('#modalTitle');
  const modalText = $('#modalText');
  let previousFocus = null;
  function openModal(title, detail, trigger) {
    previousFocus = trigger || document.activeElement;
    modalTitle.textContent = title;
    modalText.textContent = detail;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('[data-close-modal]', modal).focus?.();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }
  $$('.details-button').forEach(button => button.addEventListener('click', () => {
    openModal(button.dataset.title, button.dataset.detail, button);
  }));
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));

  // Schematic map points respond to click and keyboard focus
  $$('.map-point').forEach(point => {
    point.addEventListener('click', () => {
      $$('.map-point').forEach(other => other.classList.remove('active'));
      point.classList.add('active');
    });
    point.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        point.click();
      }
    });
  });

  // Cinematic motion system (GSAP is progressive enhancement; native CSS remains the fallback).
  const topbar = $('.topbar');
  const cursorGlow = document.createElement('div');
  cursorGlow.className = 'cursor-glow';
  cursorGlow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursorGlow);

  if (!reducedMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', event => {
      cursorGlow.style.opacity = '1';
      cursorGlow.style.left = `${event.clientX}px`;
      cursorGlow.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { cursorGlow.style.opacity = '0'; });
  }

  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      topbar?.classList.toggle('scrolled', window.scrollY > 24);
      scrollTicking = false;
    });
  }, { passive: true });

  if (window.gsap && !reducedMotion) {
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.config({ nullTargetWarn: false });

    // Opening sequence: editorial title, then supporting copy, then the landscape.
    const heroTitle = $('.hero-title');
    if (heroTitle) {
      gsap.fromTo(heroTitle.querySelector('span'),
        { yPercent: 115, rotate: 2, scale: .94, transformOrigin: 'left bottom' },
        { yPercent: 0, rotate: 0, scale: 1, duration: 1.35, ease: 'power4.out', delay: .12 });
      gsap.fromTo(heroTitle.querySelector('em'),
        { y: 48, autoAlpha: 0, skewY: 3 },
        { y: 0, autoAlpha: 1, skewY: 0, duration: 1.1, ease: 'power3.out', delay: .38 });
      gsap.fromTo('.hero-art .sun-disc',
        { scale: .72, autoAlpha: 0, rotate: -12 },
        { scale: 1, autoAlpha: 1, rotate: 0, duration: 1.7, ease: 'power3.out', delay: .22 });
      gsap.fromTo('.hero-art .ridge',
        { y: 90, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.5, stagger: .13, ease: 'power4.out', delay: .35 });

    // Extra cinematic polish: soft floating of orbit rings
    gsap.to('.orbit-one', { rotation: 360, duration: 90, repeat: -1, ease: 'none' });
    gsap.to('.orbit-two', { rotation: -360, duration: 140, repeat: -1, ease: 'none' });
    gsap.to('.sun-disc', { scale: 1.04, duration: 3.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });

    }

    // Large landscape moves against the page scroll for a cinematic depth effect.
    if (window.ScrollTrigger && $('.hero-art')) {
      gsap.to('.hero-art', {
        yPercent: 16, scale: 1.06, rotate: -2,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 }
      });
      gsap.to('.hero-copy', {
        y: -70, autoAlpha: .2, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
      gsap.to('.hero-grid', {
        yPercent: 20, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.3 }
      });
    }

    // Editorial heading reveals and card entrances are staggered as each chapter enters.
    $$('.cinematic-section').forEach((section, sectionIndex) => {
      const heading = $('.heading-main h2', section);
      if (heading) {
        gsap.fromTo(heading,
          { y: 70, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)' },
          { y: 0, autoAlpha: 1, clipPath: 'inset(0 0 0% 0)', duration: 1.15, ease: 'power4.out',
            scrollTrigger: { trigger: heading, start: 'top 88%', once: true } });
      }
      const cards = $$('.term-card, .mini-card, .heritage-card, .source-row, .kingdom-step, .timeline-item', section);
      if (cards.length) {
        gsap.fromTo(cards,
          { y: 45, autoAlpha: 0, rotateX: 2 },
          { y: 0, autoAlpha: 1, rotateX: 0, duration: .9, stagger: .095, ease: 'power3.out',
            clearProps: 'transform', scrollTrigger: { trigger: cards[0], start: 'top 91%', once: true } });
      }
      const sectionArt = $$('.origin-image, .geo-map-card, .kingdom-banner, .faith-art', section);
      sectionArt.forEach(art => {
        gsap.fromTo(art,
          { y: 42, scale: .97, autoAlpha: .6 },
          { y: 0, scale: 1, autoAlpha: 1, duration: 1.15, ease: 'power3.out',
            scrollTrigger: { trigger: art, start: 'top 92%', once: true } });
      });
      section.style.setProperty('--chapter-index', sectionIndex + 1);
    });

    // Subtle scroll-linked image movement, not a distracting constant animation.
    if (window.ScrollTrigger) {
      $$('.heritage-photo, .origin-image').forEach(art => {
        gsap.fromTo(art, { backgroundPosition: '50% 58%' }, {
          backgroundPosition: '50% 42%', ease: 'none',
          scrollTrigger: { trigger: art, start: 'top bottom', end: 'bottom top', scrub: .8 }
        });
      });
    }

    // Magnetic micro-interaction on primary buttons for mouse users only.
    if (window.matchMedia('(pointer:fine)').matches) {
      $$('.button').forEach(button => {
        button.addEventListener('pointermove', event => {
          const rect = button.getBoundingClientRect();
          const dx = (event.clientX - rect.left - rect.width / 2) * .08;
          const dy = (event.clientY - rect.top - rect.height / 2) * .12;
          gsap.to(button, { x: dx, y: dy, duration: .35, ease: 'power3.out', overwrite: true });
        });
        button.addEventListener('pointerleave', () => gsap.to(button, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,.45)', overwrite: true }));
      });
    }
  }

  // Navigation active section hint
  const navLinks = $$('.desktop-nav a');
  const sections = navLinks.map(link => $(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = navLinks.find(a => a.getAttribute('href') === `#${entry.target.id}`);
        if (link && entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    sections.forEach(section => navObserver.observe(section));
  }
  // Floating animated Hereti mini-map: collapse/expand control.
  const floatingMap = $('#floatingMap');
  const mapToggle = $('#mapToggle');
  if (floatingMap && mapToggle) {
    mapToggle.addEventListener('click', () => {
      const collapsed = floatingMap.classList.toggle('is-collapsed');
      mapToggle.textContent = collapsed ? '+' : '−';
      mapToggle.setAttribute('aria-label', collapsed ? 'მინი რუკის გახსნა' : 'მინი რუკის დახურვა');
    });
  }

  // Fixed side index follows the section currently in view.
  const sideLinks = $$('.side-index a');
  if (sideLinks.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sideLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-38% 0px -48% 0px', threshold: 0 });
    sideLinks.forEach(link => {
      const target = $(link.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });
  }


    // ========== 3D TILT & DEPTH ==========
    // Soft 3D tilt on cards following pointer
    const tiltCards = $$('.term-card, .heritage-card, .mini-card, .kingdom-step');
    if (tiltCards.length && window.matchMedia('(pointer:fine)').matches) {
      tiltCards.forEach(card => {
        card.addEventListener('pointermove', e => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          gsap.to(card, {
            rotateY: x * 14,
            rotateX: -y * 10,
            transformPerspective: 900,
            duration: 0.4,
            ease: 'power2.out',
            overwrite: true
          });
        });
        card.addEventListener('pointerleave', () => {
          gsap.to(card, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.7,
            ease: 'elastic.out(1, 0.5)',
            overwrite: true
          });
        });
      });
    }

    // Hero art deeper 3D parallax on pointer
    const heroArt3d = $('.hero-art');
    if (heroArt3d && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', e => {
        const x = (e.clientX / window.innerWidth - 0.5) * 18;
        const y = (e.clientY / window.innerHeight - 0.5) * 12;
        gsap.to(heroArt3d, {
          rotateY: x * 0.35,
          rotateX: -y * 0.25,
          transformPerspective: 1400,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        // Push ridges at different depths
        gsap.to('.ridge-back',  { x: x * 0.6, y: y * 0.4, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
        gsap.to('.ridge-mid',   { x: x * 1.1, y: y * 0.7, duration: 0.75, ease: 'power2.out', overwrite: 'auto' });
        gsap.to('.ridge-front', { x: x * 1.6, y: y * 1.0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
        gsap.to('.sun-disc',    { x: x * 0.3, y: y * 0.2, duration: 1.0, ease: 'power2.out', overwrite: 'auto' });
      }, { passive: true });
    }

    // Scroll-linked 3D depth for section cards
    $$('.cinematic-section').forEach(section => {
      const cards = $$('.term-card, .heritage-card, .mini-card', section);
      if (cards.length && window.ScrollTrigger) {
        gsap.fromTo(cards, 
          { rotateX: 8, z: -40, autoAlpha: 0.7 },
          { 
            rotateX: 0, z: 0, autoAlpha: 1, 
            duration: 1.1, 
            stagger: 0.08, 
            ease: 'power3.out',
            scrollTrigger: { trigger: cards[0], start: 'top 90%', once: true }
          }
        );
      }
    });


  // ========== GLOBE JOURNEY CONTROLS ==========
  const globeStage = $('#globeStage');
  if (globeStage) {
    const layers = $$('.globe-layer', globeStage);
    const buttons = $$('.globe-btn', globeStage);
    function setGlobeStep(step) {
      layers.forEach(l => l.classList.toggle('is-active', Number(l.dataset.step) === step));
      buttons.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === step)));
    }
    setGlobeStep(0);
    buttons.forEach(btn => {
      btn.addEventListener('click', () => setGlobeStep(Number(btn.dataset.step)));
    });
    // Auto-advance once when section enters view
    if ('IntersectionObserver' in window && !reducedMotion) {
      let autoPlayed = false;
      const globeObs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !autoPlayed) {
          autoPlayed = true;
          let s = 0;
          const iv = setInterval(() => {
            s++;
            if (s > 3) { clearInterval(iv); return; }
            setGlobeStep(s);
          }, 1600);
        }
      }, { threshold: 0.4 });
      globeObs.observe(globeStage);
    }
  }

  // ========== MONUMENTS OPEN ON SCROLL ==========
  const monumentCards = $$('.monument-card');
  if (monumentCards.length && 'IntersectionObserver' in window) {
    const monObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-open');
          // optional: unobserve after open so it stays open
          monObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });
    monumentCards.forEach(card => monObs.observe(card));
  }

})();
