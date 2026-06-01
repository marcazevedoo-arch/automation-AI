/* ==========================================================================
   Galeria.ag — BU Automação & IA
   Interatividade: reveal, counters, nav ativa, tabs, progress, keyboard
   ========================================================================== */

(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. Stagger reveal de covers (slides 1 e 17)
        Slide 1: silêncio intencional de 800ms antes do primeiro line
                 (mirror metafórico dos 5s de silêncio do roteiro)
        Slide 17: stagger reverso — começa do bottom up
     ------------------------------------------------------------------------ */
  function initStaggerReveal() {
    const groups = [
      { el: $('#sec-00'), reverse: false, initialDelay: 200 },
      { el: $('#sec-01'), reverse: false, initialDelay: 800 },
      { el: $('#sec-21'), reverse: false, initialDelay: 400 }
    ];

    groups.forEach(({ el, reverse, initialDelay }) => {
      if (!el) return;
      const items = Array.from(el.querySelectorAll('[data-stagger]'));
      if (!items.length) return;

      if (reducedMotion) {
        items.forEach(it => it.classList.add('is-staggered'));
        return;
      }

      // ordem: 0,1,2... ou (n-1),(n-2)... (reverse)
      const sorted = [...items].sort((a, b) => {
        const ai = parseInt(a.dataset.stagger, 10);
        const bi = parseInt(b.dataset.stagger, 10);
        return reverse ? bi - ai : ai - bi;
      });

      // dispara só quando a section entrar em viewport (não no load)
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !el.dataset.stagFired) {
            el.dataset.stagFired = '1';
            sorted.forEach((it, i) => {
              setTimeout(() => it.classList.add('is-staggered'), initialDelay + i * 420);
            });
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.4 });

      obs.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     2. Reveal on scroll — IntersectionObserver
     ------------------------------------------------------------------------ */
  function initScrollReveal() {
    const targets = $$('[data-reveal]');
    if (!targets.length) return;

    if (reducedMotion) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Pequeno delay para criar cascata em groups
          const parent = entry.target.parentElement;
          const siblings = parent ? Array.from(parent.children).filter(c => c.hasAttribute('data-reveal')) : [];
          const idx = Math.max(0, siblings.indexOf(entry.target));
          const delay = Math.min(idx * 90, 360);
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -60px 0px' });

    targets.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     2b. Threshold visual bars — anima largura a partir de 0
     ------------------------------------------------------------------------ */
  function initThresholdBars() {
    const bars = $$('.threshold-visual__bar[data-pct]');
    if (!bars.length) return;

    if (reducedMotion) {
      bars.forEach(el => el.style.setProperty('--pct', el.dataset.pct));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const pct = target.dataset.pct || '0';
          // pequeno delay sequencial entre as barras
          const peers = Array.from(target.parentElement.querySelectorAll('.threshold-visual__bar[data-pct]'));
          const idx = peers.indexOf(target);
          setTimeout(() => target.style.setProperty('--pct', pct), idx * 200);
          io.unobserve(target);
        }
      });
    }, { threshold: 0.4 });

    bars.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     3. Counters numéricos animados
     ------------------------------------------------------------------------ */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.to);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals, 10) || 0;
    const divisor = parseFloat(el.dataset.divisor) || 1;
    const duration = 1600;
    const start = performance.now();

    function format(n) {
      const value = n / divisor;
      const str = decimals > 0
        ? value.toFixed(decimals).replace('.', ',')
        : Math.round(value).toLocaleString('pt-BR');
      return prefix + str + suffix;
    }

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = format(target * eased);
      if (t < 1) requestAnimationFrame(frame);
      else el.textContent = format(target);
    }

    requestAnimationFrame(frame);
  }

  function initCounters() {
    const counters = $$('[data-counter]');
    if (!counters.length) return;

    if (reducedMotion) {
      counters.forEach(el => {
        const target = parseFloat(el.dataset.to);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const decimals = parseInt(el.dataset.decimals, 10) || 0;
        const divisor = parseFloat(el.dataset.divisor) || 1;
        const value = target / divisor;
        const str = decimals > 0
          ? value.toFixed(decimals).replace('.', ',')
          : Math.round(value).toLocaleString('pt-BR');
        el.textContent = prefix + str + suffix;
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    counters.forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------------
     4. Maturity bar fill
     ------------------------------------------------------------------------ */
  function initMaturityBar() {
    const bar = $('[data-maturity-fill]');
    if (!bar) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          bar.classList.add('is-active');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    io.observe(bar);
  }

  /* ------------------------------------------------------------------------
     5. Nav: estado scrolled + menu mobile
     (active-link agora é gerenciado pelo initSiteNav)
     ------------------------------------------------------------------------ */
  function initNav() {
    const nav = $('.nav');
    const main = $('main.deck');
    const navLinks = $$('.nav__list a[data-nav]');
    const toggle = $('.nav__toggle');
    if (!nav) return;

    // Scrolled state — observa o main (deck) ou window (fallback)
    const scrollHost = main || window;
    const onScroll = () => {
      const y = main ? main.scrollTop : window.scrollY;
      nav.classList.toggle('is-scrolled', y > 24);
    };
    onScroll();
    scrollHost.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('is-menu-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      navLinks.forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('is-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }
  }

  /* ------------------------------------------------------------------------
     6. Progress bar — DESATIVADA (substituída pela HUD do deck)
     ------------------------------------------------------------------------ */
  function initProgress() { /* no-op: HUD do deck assume essa função */ }

  /* ------------------------------------------------------------------------
     7. Tabs dos pilotos (Seção 05)
     ------------------------------------------------------------------------ */
  function initPilotTabs() {
    const tabs = $$('.pilots__tab');
    const panels = $$('.pilot-panel');
    if (!tabs.length) return;

    function activate(id) {
      tabs.forEach(t => {
        const isActive = t.dataset.pilot === id;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      panels.forEach(p => {
        p.classList.toggle('is-active', p.dataset.pilotPanel === id);
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(tab.dataset.pilot));
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const ids = tabs.map(t => t.dataset.pilot);
          const cur = ids.indexOf(tab.dataset.pilot);
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (cur + dir + ids.length) % ids.length;
          tabs[next].focus();
          activate(ids[next]);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     8. Site Nav — Componente 1 (progress bar) + Componente 2 (ball + TOC)
        Substitui o initSlideDeck antigo. Preserva: detecção via IO,
        keyboard nav, scroll-snap mechanics.
        Adiciona: progress fill por scroll de main.deck + bola flutuante +
        overlay full-screen com sumário (TOC) gerado do DOM (Variante A).
     ------------------------------------------------------------------------ */
  function initSiteNav() {
    const main = $('main.deck');
    const sections = $$('.section[data-section]', main);
    if (!main || !sections.length) return;

    // Títulos do roteiro v3.0 — sentence case (21 slides + capa)
    const TITLES = {
      '00': 'Capa',
      '01': 'A visão',
      '02': 'O diagnóstico',
      '03': 'O mapa externo',
      '04': '95% falham',
      '05': 'Laboratório → destino',
      '06': 'Duas frentes',
      '07': 'Modelo de negócio',
      '08': 'IP proprietário',
      '09': 'Sala de testes',
      '10': '9 departamentos',
      '11': 'Duas camadas',
      '12': 'Cenários futuros',
      '13': 'Capacidade liberada',
      '14': 'Novo modelo comercial',
      '15': 'Investimento Ano 1',
      '16': 'Estrutura de equipe',
      '17': 'Riscos & mitigações',
      '18': 'Governança · Dia 1',
      '19': 'Liderança interna',
      '20': 'Os três pedidos',
      '21': 'Decisão de arquitetura'
    };

    // -------------------- Componente 1 · Progress bar --------------------
    const progressFill = $('#progress-fill');
    function updateProgress() {
      if (!progressFill) return;
      const max = main.scrollHeight - main.clientHeight;
      const pct = max > 0 ? Math.min(100, (main.scrollTop / max) * 100) : 0;
      progressFill.style.width = pct + '%';
    }
    main.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();

    // -------------------- Componente 2 · Ball + TOC ----------------------
    const navToggle = $('#nav-toggle');
    const navCurrent = $('#nav-current');
    const toc        = $('#toc');
    const tocClose   = $('#toc-close');
    const tocList    = $('#toc-list');
    const navLinks   = $$('.nav__list a[data-nav]');
    const linkMap    = new Map(navLinks.map(a => [a.dataset.nav, a]));

    // Variante A — gera os itens do TOC a partir das seções reais do DOM
    const tocItems = [];
    if (tocList) {
      tocList.textContent = '';
      sections.forEach((sec, idx) => {
        const num = sec.dataset.section;
        const label = TITLES[num] || `Seção ${num}`;
        const slideLabel = num;  // mantém numeração do roteiro (00, 01, 02…)
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toc__item';
        btn.setAttribute('data-target', sec.id);
        btn.setAttribute('data-idx', String(idx));
        btn.setAttribute('aria-current', 'false');
        const nNum = document.createElement('span');
        nNum.className = 'toc__num';
        nNum.textContent = slideLabel;
        const nLab = document.createElement('span');
        nLab.className = 'toc__label';
        nLab.textContent = label;
        const nHint = document.createElement('span');
        nHint.className = 'toc__hint';
        nHint.setAttribute('aria-hidden', 'true');
        nHint.textContent = '→';
        btn.appendChild(nNum);
        btn.appendChild(nLab);
        btn.appendChild(nHint);
        li.appendChild(btn);
        tocList.appendChild(li);
        tocItems.push(btn);
      });
    }

    // ------- Open / close TOC --------
    let lastFocus = null;

    function openTOC() {
      if (!toc) return;
      lastFocus = document.activeElement;
      toc.classList.add('is-open');
      toc.setAttribute('aria-hidden', 'false');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
      // foca no item atual (ou no primeiro), respeitando reduced motion
      const focusTarget = tocItems.find(it => it.classList.contains('current')) || tocItems[0] || tocClose;
      if (focusTarget) requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
    }

    function closeTOC() {
      if (!toc) return;
      toc.classList.remove('is-open');
      toc.setAttribute('aria-hidden', 'true');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function isOpen() {
      return toc && toc.classList.contains('is-open');
    }

    if (navToggle) navToggle.addEventListener('click', openTOC);
    if (tocClose)  tocClose.addEventListener('click', closeTOC);

    // Click no backdrop (no overlay vazio) fecha
    if (toc) {
      toc.addEventListener('click', (e) => {
        if (e.target === toc) closeTOC();
      });
    }

    // ------- Scroll suave até a seção --------
    function scrollToId(id) {
      const el = document.getElementById(id);
      if (!el) return;
      // Em modo deck, scrollIntoView() opera no scrollable ancestor (main.deck).
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function scrollToSection(idx) {
      idx = Math.max(0, Math.min(sections.length - 1, idx));
      const sec = sections[idx];
      if (sec) scrollToId(sec.id);
    }

    // Click em item do TOC → fecha e navega
    tocItems.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        closeTOC();
        // pequeno delay para o overlay fechar antes de animar o scroll
        setTimeout(() => scrollToId(targetId), reducedMotion ? 0 : 60);
      });
    });

    // -------------------- IntersectionObserver --------------------
    // Detecta seção ativa quando ela ocupa o "centro" do main.
    // rootMargin: -40% top / -50% bottom = banda central de 10%.
    // Como o root é o main (scroll container), a banda central é onde
    // o slide considerado "atual" deve estar.
    // currentIdx = -1 garante que o primeiro setCurrent(0) execute todo o
    // toggle (incluindo body.is-on-cover) sem early-exit no init.
    let currentIdx = -1;

    function setCurrent(idx) {
      idx = Math.max(0, Math.min(sections.length - 1, idx));
      if (idx === currentIdx) return;
      currentIdx = idx;
      const sec = sections[idx];
      const num = sec.dataset.section;
      // slideLabel é o data-section direto (mantém numeração do roteiro: 00, 01, 02…)
      const slideLabel = num;

      // Toggle body.is-on-cover · esconde nav + bola + progress quando estamos na capa
      document.body.classList.toggle('is-on-cover', num === '00');

      // bola: número da seção atual
      if (navCurrent) navCurrent.textContent = slideLabel;

      // TOC: marca current + aria-current
      tocItems.forEach((it, i) => {
        const isCur = i === idx;
        it.classList.toggle('current', isCur);
        it.setAttribute('aria-current', isCur ? 'true' : 'false');
      });

      // Top nav active — agora 4 atos cobrem 17 slides
      navLinks.forEach(a => a.classList.remove('is-active'));
      const numInt = parseInt(num, 10);
      const activeAto = navLinks.find(a => {
        const s = parseInt(a.dataset.atoStart, 10);
        const e = parseInt(a.dataset.atoEnd, 10);
        return numInt >= s && numInt <= e;
      });
      if (activeAto) activeAto.classList.add('is-active');

      // Mantém a animação cinematográfica de entrada do slide
      sections.forEach((s, i) => s.classList.toggle('is-current', i === idx));
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = sections.indexOf(entry.target);
          if (idx >= 0) setCurrent(idx);
        }
      });
    }, {
      root: main,
      rootMargin: '-40% 0px -50% 0px',
      threshold: 0
    });

    sections.forEach(s => io.observe(s));

    // -------------------- Top nav + brand → scroll ----------------------
    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const num = a.dataset.nav;
        const idx = sections.findIndex(s => s.dataset.section === num);
        if (idx >= 0) scrollToSection(idx);
      });
    });
    const brand = $('.nav__brand');
    if (brand) {
      brand.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(0);
      });
    }

    // -------------------- Keyboard --------------------------------------
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Esc fecha o TOC (requisito de acessibilidade)
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        closeTOC();
        return;
      }

      // Quando o TOC está aberto, deixa Tab/Enter/Space funcionarem nele
      if (isOpen()) return;

      const k = e.key;
      let dir = 0;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'j' || k === 'J') dir = 1;
      else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp' || k === 'k' || k === 'K') dir = -1;
      else if (k === 'Home') { e.preventDefault(); scrollToSection(0); return; }
      else if (k === 'End')  { e.preventDefault(); scrollToSection(sections.length - 1); return; }

      if (dir !== 0) {
        // Se o slide tem overflow interno e ainda dá pra rolar, deixa scroll interno
        const sec = sections[currentIdx];
        const overflows = sec.scrollHeight > sec.clientHeight + 4;
        if (overflows) {
          const atTop    = sec.scrollTop <= 4;
          const atBottom = sec.scrollTop + sec.clientHeight >= sec.scrollHeight - 4;
          if (dir > 0 && !atBottom) return;
          if (dir < 0 && !atTop) return;
        }
        e.preventDefault();
        scrollToSection(currentIdx + dir);
      }
    });

    // Estado inicial
    setCurrent(0);
  }

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  /* ------------------------------------------------------------------------
     9. Magnet hover — pequeno deslocamento dos elementos .magnet
        em direção ao cursor. Toque/touchscreen ignorado.
     ------------------------------------------------------------------------ */
  function initMagnet() {
    if (reducedMotion) return;
    if (matchMedia('(hover: none)').matches) return;

    const els = $$('.magnet');
    if (!els.length) return;

    const STRENGTH = 0.18; // 18% do delta cursor-centro

    els.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = (e.clientX - cx) * STRENGTH;
        const dy = (e.clientY - cy) * STRENGTH;
        el.style.setProperty('--mx', dx.toFixed(1));
        el.style.setProperty('--my', dy.toFixed(1));
      });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--mx', '0');
        el.style.setProperty('--my', '0');
      });
    });
  }

  function init() {
    initStaggerReveal();
    initScrollReveal();
    initThresholdBars();
    initCounters();
    initMaturityBar();
    initNav();
    initProgress();
    initPilotTabs();
    initSiteNav();
    initMagnet();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
