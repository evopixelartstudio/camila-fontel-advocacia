/* =====================================================================
   Camila Fontel | Advogada — script.js
   JavaScript puro, sem dependências.
   ===================================================================== */
(function () {
  'use strict';

  /* Número do WhatsApp (somente dígitos, com DDI 55 + DDD 91) */
  var WHATSAPP_NUMBER = '5591985533131';
  var DEFAULT_MSG = 'Olá, Dra. Camila! Vim pelo seu site e gostaria de conversar sobre meu caso.';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Links de WhatsApp montados a partir do atributo data-msg
     Cada botão tem sua própria mensagem pré-preenchida.
     ------------------------------------------------------------------ */
  document.querySelectorAll('.js-whats').forEach(function (link) {
    var msg = link.getAttribute('data-msg') || DEFAULT_MSG;
    link.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
  });

  /* ------------------------------------------------------------------
     2. Header: sombra ao rolar
     ------------------------------------------------------------------ */
  var header = document.querySelector('.site-header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ------------------------------------------------------------------
     3. Menu mobile (abre/fecha, aria-expanded, Esc, clique no link)
     ------------------------------------------------------------------ */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('menu-principal');
  var desktopMQ = window.matchMedia('(min-width: 960px)');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  toggle.addEventListener('click', function () {
    var willOpen = toggle.getAttribute('aria-expanded') !== 'true';
    setMenu(willOpen);
    if (willOpen) {
      var first = nav.querySelector('a');
      if (first) first.focus();
    }
  });

  // Fecha ao clicar em qualquer link do menu
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && !desktopMQ.matches) setMenu(false);
  });

  // Fecha com Esc e devolve o foco ao botão
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });

  // Fecha ao clicar fora do painel
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      setMenu(false);
    }
  });

  // Ao passar para desktop, garante que o estado mobile seja limpo
  desktopMQ.addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* ------------------------------------------------------------------
     4. Scroll suave + destaque do item ativo do menu
     (o CSS já faz scroll-behavior: smooth; aqui tratamos foco e
      respeitamos prefers-reduced-motion)
     ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      // Move o foco para a seção (acessibilidade para leitores de tela/teclado)
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      history.replaceState(null, '', id);
    });
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var activeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (l) {
          var isActive = l.getAttribute('href') === id;
          l.classList.toggle('is-active', isActive);
          if (isActive) l.setAttribute('aria-current', 'true');
          else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' }); // "linha" no meio da tela
    sections.forEach(function (s) { activeObserver.observe(s); });

    // Limpa o destaque quando volta ao topo (hero)
    var hero = document.getElementById('inicio');
    if (hero) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          navLinks.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
        }
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ------------------------------------------------------------------
     5. Animações de entrada (fade + leve subida)
     O CSS só esconde os elementos se o usuário NÃO pediu movimento reduzido.
     ------------------------------------------------------------------ */
  var reveals = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // Pequeno atraso escalonado entre irmãos (cards aparecem em sequência)
    reveals.forEach(function (el) {
      var siblings = el.parentElement ? el.parentElement.querySelectorAll(':scope > .reveal') : [];
      var index = Array.prototype.indexOf.call(siblings, el);
      if (index > 0) el.style.setProperty('--delay', Math.min(index, 4) * 0.1 + 's');
    });

    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     6. FAQ: accordion acessível
     - Enter/Espaço (nativo do <button>) abre/fecha
     - Setas ↑/↓ navegam entre perguntas; Home/End vão à primeira/última
     ------------------------------------------------------------------ */
  var faqButtons = Array.prototype.slice.call(document.querySelectorAll('.faq-btn'));

  faqButtons.forEach(function (btn, i) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      if (!open) {
        panel.classList.remove('is-animating');
        void panel.offsetWidth; // reinicia a animação
        panel.classList.add('is-animating');
      }
    });

    btn.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown') next = faqButtons[(i + 1) % faqButtons.length];
      else if (e.key === 'ArrowUp') next = faqButtons[(i - 1 + faqButtons.length) % faqButtons.length];
      else if (e.key === 'Home') next = faqButtons[0];
      else if (e.key === 'End') next = faqButtons[faqButtons.length - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });
  });

  /* ------------------------------------------------------------------
     6b. Mapa do Brasil: linhas curvas saindo do escritório (data-hub)
     até as capitais. Para mudar a cidade, altere data-hub no HTML.
     ------------------------------------------------------------------ */
  var brMap = document.getElementById('br-map');
  if (brMap) {
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var hub = brMap.getAttribute('data-hub').split(',').map(Number);
    // Posições aproximadas de capitais no mesmo sistema de coordenadas do contorno
    var capitals = [
      [140, 86], [133, 27], [101, 143], [62, 155], [229, 55], [179, 211],
      [194, 259], [261, 213], [247, 222], [257, 157], [312, 106], [350, 96],
      [382, 136], [352, 187], [301, 254], [306, 281], [274, 290], [247, 309],
      [251, 331], [228, 355],
      // pontos extras no interior, para preencher o mapa
      [60, 120], [110, 110], [170, 120], [200, 90], [95, 60], [170, 160],
      [215, 180], [230, 260], [290, 160], [320, 140], [300, 210], [210, 230],
      [190, 240], [330, 200], [280, 120], [120, 150]
    ];
    var routes = brMap.querySelector('.br-routes');
    var dots = brMap.querySelector('.br-dots');
    // Posiciona o marcador do escritório
    var hubMarker = brMap.querySelector('.br-hub');
    if (hubMarker) hubMarker.setAttribute('transform', 'translate(' + hub[0] + ' ' + hub[1] + ')');

    capitals.forEach(function (c, i) {
      // Ponto de controle deslocado na perpendicular para criar o arco
      var mx = (hub[0] + c[0]) / 2, my = (hub[1] + c[1]) / 2;
      var dx = c[0] - hub[0], dy = c[1] - hub[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var bend = Math.min(60, len * 0.25);
      var cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', 'M' + hub[0] + ' ' + hub[1] + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + c[0] + ' ' + c[1]);
      path.setAttribute('pathLength', '1');
      path.style.transitionDelay = (i * 0.035) + 's';
      routes.appendChild(path);

      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', c[0]);
      dot.setAttribute('cy', c[1]);
      dot.setAttribute('r', '3.2');
      dots.appendChild(dot);
    });

    // Desenha as linhas quando o mapa entra na tela
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      brMap.classList.add('is-drawn');
    } else {
      new IntersectionObserver(function (entries, obs) {
        if (entries[0].isIntersecting) {
          brMap.classList.add('is-drawn');
          obs.disconnect();
        }
      }, { threshold: 0.3 }).observe(brMap);
    }
  }

  /* ------------------------------------------------------------------
     6c. Faixas com texto correndo: duplica o conteúdo para o loop
     ficar contínuo (a animação desloca a trilha em -50%).
     ------------------------------------------------------------------ */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    var group = track.querySelector('.marquee-group');
    if (group) track.appendChild(group.cloneNode(true));
  });

  /* ------------------------------------------------------------------
     6d. Carrossel de direitos: setas, pontinhos e rolagem por toque
     ------------------------------------------------------------------ */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var cards = Array.prototype.slice.call(track.children);
    var dotsWrap = carousel.querySelector('.carousel-dots');
    var prev = carousel.querySelector('.carousel-prev');
    var next = carousel.querySelector('.carousel-next');
    if (!cards.length) return;

    function step() {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return cards[0].getBoundingClientRect().width + gap;
    }
    function atEnd() { return track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
    function goTo(i) { track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' }); }

    var dots = cards.map(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Ir para o card ' + (i + 1) + ' de ' + cards.length);
      b.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function update() {
      var idx = atEnd() ? cards.length - 1 : Math.round(track.scrollLeft / step());
      dots.forEach(function (d, i) {
        if (i === idx) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    next.addEventListener('click', function () {
      if (atEnd()) goTo(0);                    // volta ao início
      else track.scrollBy({ left: step(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    prev.addEventListener('click', function () {
      if (track.scrollLeft <= 4) goTo(cards.length - 1);
      else track.scrollBy({ left: -step(), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }, { passive: true });
    update();
  });

  /* ------------------------------------------------------------------
     6e. Partículas leves flutuando (canvas fixo, sem bloquear cliques).
     Desligadas se o usuário pediu movimento reduzido.
     ------------------------------------------------------------------ */
  var canvas = document.getElementById('particles');
  if (canvas && canvas.getContext && !prefersReducedMotion) {
    var ctx = canvas.getContext('2d');
    var COLORS = ['233,175,200', '255,255,255', '122,31,92', '214,168,140'];
    var parts = [];
    var W = 0, H = 0, running = true;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(randomY) {
      return {
        x: Math.random() * W,
        y: randomY ? Math.random() * H : H + 10,
        r: 0.6 + Math.random() * 1.9,
        vy: -(0.08 + Math.random() * 0.28),
        vx: (Math.random() - 0.5) * 0.12,
        a: 0.18 + Math.random() * 0.4,
        t: Math.random() * Math.PI * 2,
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
    }
    resize();
    var count = W < 640 ? 22 : 46;
    for (var p = 0; p < count; p++) parts.push(spawn(true));

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (pt, i) {
        pt.t += 0.02;
        pt.x += pt.vx + Math.sin(pt.t) * 0.12;
        pt.y += pt.vy;
        if (pt.y < -10 || pt.x < -10 || pt.x > W + 10) parts[i] = pt = spawn(false);
        var alpha = pt.a * (0.55 + 0.45 * Math.sin(pt.t * 1.3));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + pt.c + ',' + alpha.toFixed(3) + ')';
        ctx.shadowColor = 'rgba(' + pt.c + ',' + (alpha * 0.9).toFixed(3) + ')';
        ctx.shadowBlur = pt.r * 4;
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', resize, { passive: true });
    // Pausa quando a aba não está visível (economiza bateria)
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
  }

  /* ------------------------------------------------------------------
     7. Fallback de imagens: enquanto as fotos reais não forem colocadas
     em /assets, mostra o monograma/placeholder em vez de ícone quebrado.
     ------------------------------------------------------------------ */
  document.querySelectorAll('.photo-frame img, .insta-item img').forEach(function (img) {
    function markMissing() { img.classList.add('is-missing'); }
    img.addEventListener('error', markMissing, { once: true });
    // Se já "terminou" sem pixels (pode ter falhado antes do script rodar),
    // confirma com uma imagem de teste antes de esconder.
    if (img.complete && img.naturalWidth === 0) {
      var probe = new Image();
      probe.onerror = markMissing;
      probe.src = img.currentSrc || img.src;
    }
  });

  /* ------------------------------------------------------------------
     8. Ano atual no rodapé
     ------------------------------------------------------------------ */
  var year = document.getElementById('ano');
  if (year) year.textContent = new Date().getFullYear();
})();
