/* ============================================================
   LCI Animation Engine — v3.2 (Performance Optimised)
   - RAF-throttled scroll & mousemove handlers
   - Removed dynamic backdrop-filter updates (CSS handles it)
   - Reduced particle count
   - Magnetic buttons capped to desktop only
   ============================================================ */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── RAF throttle helper ─────────────────────────────────────── */
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { fn(); ticking = false; });
    };
  }

  /* ══════════════════════════════════════════════════════════════
     PAGE HERO — Floating particles & mouse-parallax
     ══════════════════════════════════════════════════════════════ */
  var pageHero = document.getElementById('page-hero');
  if (pageHero && !prefersReduced) {

    /* 1 — Spawn floating particles (reduced from 18 → 8) */
    var PARTICLE_COUNT = 8;
    for (var pi = 0; pi < PARTICLE_COUNT; pi++) {
      var dot = document.createElement('div');
      dot.className = 'hero-particle';
      var size = 2 + Math.random() * 4;
      dot.style.cssText = [
        'width:'   + size + 'px',
        'height:'  + size + 'px',
        'left:'    + (Math.random() * 100) + '%',
        'bottom:'  + (Math.random() * 60)  + '%',
        '--dur:'   + (6 + Math.random() * 10) + 's',
        '--delay:' + -(Math.random() * 8)  + 's',
      ].join(';');
      pageHero.appendChild(dot);
    }

    /* 2 — Mouse parallax: RAF-throttled */
    var heroMouseRaf = false;
    var heroMX = 0, heroMY = 0;
    pageHero.addEventListener('mousemove', function (e) {
      var rect = pageHero.getBoundingClientRect();
      heroMX = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      heroMY = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      if (heroMouseRaf) return;
      heroMouseRaf = true;
      requestAnimationFrame(function () {
        pageHero.querySelectorAll('.hero-page-orb').forEach(function (orb, i) {
          var depth = 0.5 + i * 0.3;
          orb.style.transform = 'translate(' + (heroMX * 18 * depth) + 'px,' + (heroMY * 12 * depth) + 'px)';
          orb.style.transition = 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)';
        });
        var wm = pageHero.querySelector('.hero-cross-watermark');
        if (wm) {
          wm.style.transform = 'translateY(-50%) translate(' + (heroMX * 8) + 'px,' + (heroMY * 5) + 'px)';
          wm.style.transition = 'transform 0.8s ease';
        }
        heroMouseRaf = false;
      });
    });
    pageHero.addEventListener('mouseleave', function () {
      pageHero.querySelectorAll('.hero-page-orb').forEach(function (orb) {
        orb.style.transform = '';
        orb.style.transition = 'transform 1s ease';
      });
      var wm = pageHero.querySelector('.hero-cross-watermark');
      if (wm) { wm.style.transform = 'translateY(-50%)'; }
    });

    /* 3 — Stats pills stagger in */
    var pills = pageHero.querySelectorAll('.hero-stat-pill');
    pills.forEach(function (pill, i) {
      pill.style.opacity = '0';
      pill.style.transform = 'translateY(16px)';
      setTimeout(function () {
        pill.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
        pill.style.opacity = '1';
        pill.style.transform = 'translateY(0)';
      }, 900 + i * 120);
    });
  }

  /* ── Scroll Progress Bar ────────────────────────────────────── */
  var prog = document.getElementById('scrollProgress');
  function updateProgress() {
    if (!prog) return;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }

  /* ── Parallax Hero (index.html slider) ─────────────────────── */
  function parallaxHero() {
    if (prefersReduced) return;
    var slider = document.querySelector('.lci-slider');
    if (!slider) return;
    var y = window.scrollY, h = slider.offsetHeight;
    if (y > h) return;
    var p = y / h;
    document.querySelectorAll('.lci-slide-bg img').forEach(function (img) {
      img.style.transform = 'translateY(' + (p * 44) + 'px) scale(1.08)';
    });
    document.querySelectorAll('.hero-orb').forEach(function (orb, i) {
      orb.style.transform = 'translateY(' + (p * (i % 2 === 0 ? -26 : 20)) + 'px)';
    });
  }

  /* ── Parallax for inner-page hero banners ───────────────────── */
  function parallaxPageHero() {
    if (prefersReduced) return;
    var ph = document.querySelector('.lci-page-hero');
    if (!ph) return;
    var y = window.scrollY;
    var h = ph.offsetHeight;
    if (y > h * 1.5) return;
    var p = y / h;
    ph.style.backgroundPositionY = (50 + p * 18) + '%';
    var inner = ph.querySelector('.lci-container');
    if (inner) {
      inner.style.transform  = 'translateY(' + (p * -30) + 'px)';
      inner.style.opacity    = String(Math.max(0, 1 - p * 1.8));
      inner.style.transition = 'none';
    }
    ph.querySelectorAll('.hero-page-orb').forEach(function (orb, i) {
      var dir = i % 2 === 0 ? 1 : -1;
      orb.style.transform = 'translateY(' + (p * 40 * dir) + 'px)';
      orb.style.transition = 'none';
    });
  }

  /* ── Combined scroll handler (single RAF-throttled listener) ── */
  window.addEventListener('scroll', rafThrottle(function () {
    updateProgress();
    parallaxHero();
    parallaxPageHero();
  }), { passive: true });

  /* ── Section headings draw-in ───────────────────────────────── */
  var sectionHeaders = document.querySelectorAll('.lci-section-header');
  if ('IntersectionObserver' in window && sectionHeaders.length) {
    var hIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in-view'); hIO.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    sectionHeaders.forEach(function (el) { hIO.observe(el); });
  }

  /* ── Count-Up Numbers ───────────────────────────────────────── */
  document.querySelectorAll('.count-up').forEach(function (el) {
    var started = false;
    var target  = parseInt(el.getAttribute('data-target'), 10) || 0;
    if (!('IntersectionObserver' in window)) { el.textContent = target; return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || started) return;
      started = true; io.disconnect();
      if (prefersReduced) { el.textContent = target; return; }
      var dur = 1800, start = performance.now();
      (function step(now) {
        var t = Math.min((now - start) / dur, 1);
        var ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * target);
        if (t < 1) requestAnimationFrame(step); else el.textContent = target;
      })(start);
    }, { threshold: 0.5 });
    io.observe(el);
  });

  /* ── Staggered stat items ───────────────────────────────────── */
  var statGrid = document.querySelector('.lci-stats-grid');
  if (statGrid && 'IntersectionObserver' in window) {
    var stIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      stIO.disconnect();
      statGrid.querySelectorAll('.stagger-child').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('visible'); }, i * 140);
      });
    }, { threshold: 0.2 });
    stIO.observe(statGrid);
  }

  /* ── Social CTA staggered entrance ─────────────────────────── */
  var socialGrid = document.querySelector('.social-cta-grid');
  if (socialGrid && 'IntersectionObserver' in window) {
    var scCards = socialGrid.querySelectorAll('.social-cta-item');
    scCards.forEach(function (c) {
      c.style.cssText += 'opacity:0;transform:translateY(30px) scale(0.95);transition:opacity .55s ease,transform .55s cubic-bezier(0.34,1.56,0.64,1)';
    });
    var scIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return; scIO.disconnect();
      scCards.forEach(function (c, i) {
        setTimeout(function () { c.style.opacity = '1'; c.style.transform = 'translateY(0) scale(1)'; }, i * 120);
      });
    }, { threshold: 0.2 });
    scIO.observe(socialGrid);
  }

  /* ── 3D Tilt on Ministry Cards (desktop only, RAF-throttled) ── */
  var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!prefersReduced && isDesktop) {
    document.querySelectorAll('.lci-ministry-card, .mini-card').forEach(function (card) {
      var tiltRaf = false, tdx = 0, tdy = 0;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        tdx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
        tdy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
        if (tiltRaf) return;
        tiltRaf = true;
        requestAnimationFrame(function () {
          var intensity = card.classList.contains('mini-card') ? 5 : 8;
          card.style.transform = 'perspective(700px) rotateX(' + (-tdy * intensity) + 'deg) rotateY(' + (tdx * intensity) + 'deg) translateY(-10px) scale(1.02)';
          card.style.transition = 'none';
          tiltRaf = false;
        });
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)';
        card.style.transform  = '';
      });
    });
  }

  /* ── Magnetic buttons (desktop only, RAF-throttled) ─────────── */
  if (!prefersReduced && isDesktop) {
    document.querySelectorAll('.lci-btn-gold, .lci-btn-primary, .lci-btn-give').forEach(function (btn) {
      var magRaf = false, mdx = 0, mdy = 0;
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        mdx = (e.clientX - r.left - r.width  / 2) * 0.2;
        mdy = (e.clientY - r.top  - r.height / 2) * 0.2;
        if (magRaf) return;
        magRaf = true;
        requestAnimationFrame(function () {
          btn.style.transform  = 'translate(' + mdx + 'px,' + mdy + 'px) scale(1.04)';
          btn.style.transition = 'none';
          magRaf = false;
        });
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transition = 'transform 0.45s ease';
        btn.style.transform  = '';
      });
    });
  }

  /* ── Click ripple on buttons ────────────────────────────────── */
  if (!prefersReduced) {
    var ripCSS = document.createElement('style');
    ripCSS.textContent = '@keyframes ripOut{to{transform:scale(1);opacity:0}}';
    document.head.appendChild(ripCSS);
    document.querySelectorAll('.lci-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var r = btn.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 1.6;
        var rip  = document.createElement('span');
        rip.style.cssText =
          'position:absolute;border-radius:50%;background:rgba(255,255,255,0.2);' +
          'width:' + size + 'px;height:' + size + 'px;' +
          'top:'  + (e.clientY - r.top  - size / 2) + 'px;' +
          'left:' + (e.clientX - r.left - size / 2) + 'px;' +
          'transform:scale(0);animation:ripOut 0.55s ease-out forwards;pointer-events:none;';
        btn.style.overflow = 'hidden';
        btn.appendChild(rip);
        setTimeout(function () { rip.remove(); }, 600);
      });
    });
  }

  /* ── Hero slide word-by-word entrance ───────────────────────── */
  function animateSlideWords(slide) {
    if (prefersReduced) return;
    var title = slide.querySelector('.lci-slide-title');
    if (!title) return;
    var textNodes = [];
    (function walk(node) {
      node.childNodes.forEach(function (child) {
        if (child.nodeType === 3 && child.textContent.trim()) textNodes.push(child);
        else if (child.nodeType === 1) walk(child);
      });
    })(title);
    var idx = 0;
    textNodes.forEach(function (tn) {
      var words = tn.textContent.split(/(\s+)/);
      var frag  = document.createDocumentFragment();
      words.forEach(function (w) {
        if (/\S/.test(w)) {
          var s = document.createElement('span');
          s.className = 'w-anim';
          s.textContent = w;
          s.style.cssText = 'display:inline-block;opacity:0;transform:translateY(18px);transition:opacity .4s ease,transform .4s ease;transition-delay:' + (90 + idx * 65) + 'ms';
          frag.appendChild(s); idx++;
        } else { frag.appendChild(document.createTextNode(w)); }
      });
      tn.parentNode.replaceChild(frag, tn);
    });
    requestAnimationFrame(function () {
      title.querySelectorAll('.w-anim').forEach(function (s) {
        s.style.opacity = '1'; s.style.transform = 'translateY(0)';
      });
    });
  }

  var sliderEl = document.querySelector('.lci-slider');
  if (sliderEl && !prefersReduced) {
    var firstSlide = sliderEl.querySelector('.lci-slide.active');
    if (firstSlide) animateSlideWords(firstSlide);
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === 'class' && m.target.classList.contains('active')) animateSlideWords(m.target);
      });
    });
    sliderEl.querySelectorAll('.lci-slide').forEach(function (s) { mo.observe(s, { attributes: true, attributeFilter: ['class'] }); });

    /* Mouse parallax on hero orbs — RAF-throttled */
    if (isDesktop) {
      var sliderRaf = false, scx = 0, scy = 0;
      sliderEl.addEventListener('mousemove', function (e) {
        var r  = sliderEl.getBoundingClientRect();
        scx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
        scy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
        if (sliderRaf) return;
        sliderRaf = true;
        requestAnimationFrame(function () {
          document.querySelectorAll('.hero-orb').forEach(function (orb, i) {
            var d = 0.6 + i * 0.4;
            orb.style.transform = 'translateY(0) translate(' + (scx * 22 * d) + 'px,' + (scy * 14 * d) + 'px)';
            orb.style.transition = 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)';
          });
          sliderRaf = false;
        });
      });
      sliderEl.addEventListener('mouseleave', function () {
        document.querySelectorAll('.hero-orb').forEach(function (orb) {
          orb.style.transform = ''; orb.style.transition = 'transform 1.2s ease';
        });
      });
    }
  }

  /* ── Footer link hover animation ───────────────────────────── */
  if (isDesktop) {
    document.querySelectorAll('.lci-footer-links a').forEach(function (a) {
      a.addEventListener('mouseenter', function () { a.style.letterSpacing = '0.02em'; });
      a.addEventListener('mouseleave', function () { a.style.letterSpacing = ''; });
    });
  }

  /* ── Audio play pulse ───────────────────────────────────────── */
  document.querySelectorAll('audio').forEach(function (audio) {
    var card = audio.closest('.audio-player-card, .lci-audio-card');
    var icon = card ? (card.querySelector('.audio-player-icon') || card.querySelector('.lci-audio-icon')) : null;
    if (!icon) return;
    audio.addEventListener('play', function () {
      if (!prefersReduced) {
        icon.style.animation   = 'heroOrbFloat 1.4s ease-in-out infinite';
        icon.style.boxShadow   = '0 0 24px rgba(245,158,11,0.6)';
        icon.style.borderColor = 'rgba(245,158,11,0.9)';
      }
    });
    audio.addEventListener('pause', function () {
      icon.style.animation = icon.style.boxShadow = icon.style.borderColor = '';
    });
  });

  /* ── Newsletter micro-feedback ──────────────────────────────── */
  var nForm = document.querySelector('.lci-newsletter-form');
  if (nForm) {
    nForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn  = nForm.querySelector('button[type="submit"]');
      var orig = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-check"></i> You\'re subscribed!';
      btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';
      btn.disabled = true;
      setTimeout(function () {
        btn.innerHTML = orig; btn.style.background = ''; btn.disabled = false; nForm.reset();
      }, 3500);
    });
  }

  /* ── Vision item hover glow ─────────────────────────────────── */
  document.querySelectorAll('.vision-item').forEach(function (item) {
    item.addEventListener('mouseenter', function () { item.style.boxShadow = '0 16px 48px rgba(55,48,163,0.13)'; });
    item.addEventListener('mouseleave', function () { item.style.boxShadow = ''; });
  });

  /* ── Pastor org badge hover ─────────────────────────────────── */
  document.querySelectorAll('.pastor-org-badge').forEach(function (badge) {
    badge.addEventListener('mouseenter', function () {
      if (!prefersReduced) badge.style.boxShadow = '0 4px 16px rgba(55,48,163,0.18)';
    });
    badge.addEventListener('mouseleave', function () { badge.style.boxShadow = ''; });
  });

  /* ── Giving circles parallax (RAF-throttled) ────────────────── */
  if (!prefersReduced) {
    window.addEventListener('scroll', rafThrottle(function () {
      var gs = document.querySelector('.giving-section');
      if (!gs) return;
      var rect = gs.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      var p = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      gs.querySelectorAll('[style*="border-radius:50%"]').forEach(function (el) {
        el.style.transform = 'translateY(' + ((p - 0.5) * -48) + 'px)';
      });
    }), { passive: true });
  }

})();
