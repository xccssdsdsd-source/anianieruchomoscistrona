/* Ania Nieruchomości — skrypty strony publicznej.
   Bez zależności zewnętrznych: jedna pętla rAF, IntersectionObserver
   i przejścia CSS. Wszystko degraduje się do statycznej strony. */
(function () {
  'use strict';

  var docEl = document.documentElement;
  docEl.classList.remove('no-js');

  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = motionQuery.matches;
  // Zmiana ustawienia systemowego ma działać bez przeładowania strony.
  var onMotionChange = function (e) {
    reduce = e.matches;
    if (reduce) resetParallax();
  };
  if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
  else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

  var clamp01 = function (n) { return n < 0 ? 0 : n > 1 ? 1 : n; };

  /* ───────────── Sekwencja wejścia ───────────── */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { docEl.classList.add('is-ready'); });
  });

  /* ───────────── Nagłówek + pasek postępu + parallaksa ───────────── */
  var header = document.querySelector('[data-header]');
  var progress = document.querySelector('[data-progress]');
  var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var lastY = window.pageYOffset;
  var ticking = false;

  function measure(el) {
    var r = el.getBoundingClientRect();
    el._top = r.top + window.pageYOffset;
    el._h = r.height;
  }
  parallaxEls.forEach(measure);

  function resetParallax() {
    parallaxEls.forEach(function (el) {
      el.style.transform = '';
      el.style.willChange = '';
    });
  }

  // Licz tylko elementy widoczne w viewport.
  if ('IntersectionObserver' in window && parallaxEls.length) {
    var pxIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target._live = entry.isIntersecting;
        entry.target.style.willChange = entry.isIntersecting ? 'transform' : '';
      });
    }, { rootMargin: '15% 0px' });
    parallaxEls.forEach(function (el) { pxIO.observe(el); });
  } else {
    parallaxEls.forEach(function (el) { el._live = true; });
  }

  function frame() {
    ticking = false;
    var y = window.pageYOffset;
    var vh = window.innerHeight;

    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      // Chowanie nagłówka przy scrollu w dół — tylko na wąskich ekranach.
      if (window.innerWidth <= 768 && !document.body.classList.contains('nav-open')) {
        header.classList.toggle('is-hidden', y > 220 && y > lastY);
      } else {
        header.classList.remove('is-hidden');
      }
    }

    if (progress) {
      var max = document.body.scrollHeight - vh;
      progress.style.transform = 'scaleX(' + (max > 0 ? clamp01(y / max) : 0) + ')';
    }

    if (!reduce) {
      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        if (el._live === false) continue;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0;
        var p = clamp01((y + vh - el._top) / (vh + el._h));
        el.style.transform = 'translate3d(0,' + ((p - 0.5) * el._h * speed).toFixed(2) + 'px,0)';
      }
    }

    lastY = y;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    parallaxEls.forEach(measure);
    onScroll();
  }, { passive: true });
  frame();

  /* ───────────── Menu mobilne ───────────── */
  var burger = document.querySelector('[data-burger]');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ───────────── Reveal przy scrollu ───────────── */
  var revealEls = [].slice.call(document.querySelectorAll('[data-reveal]'));

  function revealAll() {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }
  // Hak dla QA — czyni zrzuty pełnostronicowe deterministycznymi.
  window.__revealAll = revealAll;

  if (reduce || !('IntersectionObserver' in window)) {
    revealAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var explicit = el.getAttribute('data-delay');
        if (explicit) {
          el.style.transitionDelay = explicit + 'ms';
        } else if (el.parentElement) {
          var sibs = [].slice.call(el.parentElement.querySelectorAll(':scope > [data-reveal]'));
          var idx = sibs.indexOf(el);
          if (idx > 0) el.style.transitionDelay = Math.min(idx, 8) * 90 + 'ms';
        }
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });

    // Cokolwiek zostało nieodsłonięte po pełnym załadowaniu, a jest nad zgięciem.
    window.addEventListener('load', function () {
      revealEls.forEach(function (el) {
        if (el.classList.contains('is-in')) return;
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
      });
    });
  }

  /* ───────────── Liczniki (tylko prawdziwe liczby) ───────────── */
  var counters = [].slice.call(document.querySelectorAll('[data-count-to]'));
  if (counters.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count-to'); });
    } else {
      var cIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          cIO.unobserve(el);
          var target = parseFloat(el.getAttribute('data-count-to')) || 0;
          var start = performance.now();
          var dur = 900;
          (function step(now) {
            var t = clamp01((now - start) / dur);
            var eased = 1 - Math.pow(1 - t, 3);
            el.textContent = String(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(step);
          })(start);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cIO.observe(el); });
    }
  }

  /* ───────────── Filtrowanie, wyszukiwanie, sortowanie ───────────── */
  var searchbar = document.querySelector('[data-searchbar]');
  var offersIndex = document.querySelector('[data-offers]');

  if (searchbar && offersIndex) {
    var rows = [].slice.call(offersIndex.querySelectorAll('[data-offer]'));
    var input = searchbar.querySelector('[data-search-input]');
    var clearBtn = searchbar.querySelector('[data-search-clear]');
    var sortSel = searchbar.querySelector('[data-sort]');
    var countOut = searchbar.querySelector('[data-results-count]');
    var emptyState = document.querySelector('[data-empty-state]');
    var field = searchbar.querySelector('.search-field');

    var state = { kategoria: '', typ: '', q: '', sort: 'domyslnie' };

    var norm = function (s) {
      return (s || '')
        .toLowerCase()
        .replace(/[ąĄ]/g, 'a').replace(/[ćĆ]/g, 'c').replace(/[ęĘ]/g, 'e')
        .replace(/[łŁ]/g, 'l').replace(/[ńŃ]/g, 'n').replace(/[óÓ]/g, 'o')
        .replace(/[śŚ]/g, 's').replace(/[źŹżŻ]/g, 'z');
    };

    function matches(row) {
      if (state.kategoria && row.dataset.kategoria !== state.kategoria) return false;
      if (state.typ && row.dataset.typ !== state.typ) return false;
      if (state.q && norm(row.dataset.szukaj).indexOf(norm(state.q)) === -1) return false;
      return true;
    }

    function sortValue(row) {
      switch (state.sort) {
        case 'powierzchnia-rosnaco':
        case 'powierzchnia-malejaco':
          return parseFloat(row.dataset.powierzchnia) || 0;
        case 'cena-rosnaco':
        case 'cena-malejaco':
          return parseFloat(row.dataset.cena) || 0;
        default:
          return parseFloat(row.dataset.kolejnosc) || 0;
      }
    }

    function apply() {
      // FLIP — zapamiętaj pozycje przed zmianą
      var first = {};
      rows.forEach(function (r, i) {
        if (!r.hidden) first[i] = r.getBoundingClientRect().top;
      });

      var visible = rows.filter(matches);
      var desc = state.sort.indexOf('malejaco') !== -1;
      var hasPrice = function (r) { return (parseFloat(r.dataset.cena) || 0) > 0; };

      if (state.sort !== 'domyslnie') {
        visible.sort(function (a, b) {
          // Oferty bez ceny zawsze na końcu przy sortowaniu cenowym.
          if (state.sort.indexOf('cena') === 0) {
            if (hasPrice(a) !== hasPrice(b)) return hasPrice(a) ? -1 : 1;
          }
          var d = sortValue(a) - sortValue(b);
          return desc ? -d : d;
        });
      } else {
        visible.sort(function (a, b) { return sortValue(a) - sortValue(b); });
      }

      rows.forEach(function (r) { r.hidden = true; });
      visible.forEach(function (r) { r.hidden = false; offersIndex.appendChild(r); });

      if (countOut) {
        var n = visible.length;
        countOut.textContent = n + ' ' + (n === 1 ? 'oferta' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'oferty' : 'ofert'));
      }
      if (emptyState) emptyState.hidden = visible.length !== 0;

      // FLIP — odtwórz różnicę i pozwól CSS ją zanimować
      if (!reduce) {
        offersIndex.classList.add('is-filtering');
        rows.forEach(function (r, i) {
          if (r.hidden || first[i] === undefined) return;
          var delta = first[i] - r.getBoundingClientRect().top;
          if (!delta) return;
          r.style.transition = 'none';
          r.style.transform = 'translateY(' + delta + 'px)';
          requestAnimationFrame(function () {
            r.style.transition = '';
            r.style.transform = '';
          });
        });
      }
      parallaxEls.forEach(measure);
    }

    searchbar.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var key = btn.getAttribute('data-filter');
        var val = btn.getAttribute('data-value') || '';
        state[key] = state[key] === val ? '' : val;
        searchbar.querySelectorAll('[data-filter="' + key + '"]').forEach(function (b) {
          b.classList.toggle('is-on', (b.getAttribute('data-value') || '') === state[key]);
        });
        apply();
      });
    });

    if (input) {
      var debounce;
      input.addEventListener('input', function () {
        state.q = input.value.trim();
        if (field) field.classList.toggle('has-value', state.q !== '');
        clearTimeout(debounce);
        debounce = setTimeout(apply, 160);
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = ''; state.q = '';
        if (field) field.classList.remove('has-value');
        apply();
      });
    }
    if (sortSel) {
      sortSel.addEventListener('change', function () { state.sort = sortSel.value; apply(); });
    }

    // Formularz nie ma przeładowywać strony, skoro JS działa.
    var form = searchbar.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
  }

  /* ───────────── Asystent doboru ───────────── */
  var advisor = document.querySelector('[data-advisor]');
  if (advisor) {
    var advForm = advisor.querySelector('form');
    var advText = advisor.querySelector('textarea');
    var advOut = advisor.querySelector('[data-advisor-out]');
    var advBtn = advisor.querySelector('[data-advisor-submit]');
    var busy = false;

    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    };

    advForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = advText.value.trim();
      if (!q || busy) return;
      busy = true;
      advBtn.disabled = true;
      advOut.hidden = false;
      advOut.innerHTML = '<p class="advisor-mode"><span class="advisor-spinner"></span> Szukam dopasowań…</p>';

      fetch('/api/dobor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zapytanie: q })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            advOut.innerHTML = '<p class="advisor-mode">' + esc(data.error) + '</p>';
            return;
          }
          var html = '<p class="advisor-mode">' + esc(data.modeLabel || '') + '</p>';
          if (!data.matches || !data.matches.length) {
            html += '<p class="advisor-hint">Nie znalazłam dopasowania wśród aktualnych ofert. ' +
                    'Zadzwoń — mam też oferty, które nie trafiają na portale.</p>';
          } else {
            data.matches.forEach(function (m, i) {
              html += '<a class="advisor-match" href="' + esc(m.url) + '">' +
                '<span class="advisor-match-n">' + String(i + 1).padStart(2, '0') + '</span>' +
                '<span><span class="advisor-match-t">' + esc(m.title) + '</span>' +
                '<span class="advisor-match-r">' + esc(m.reason) + '</span></span>' +
                '<span class="link-arrow"></span></a>';
            });
          }
          advOut.innerHTML = html;
        })
        .catch(function () {
          advOut.innerHTML = '<p class="advisor-mode">Nie udało się połączyć. Spróbuj ponownie za chwilę.</p>';
        })
        .finally(function () { busy = false; advBtn.disabled = false; });
    });
  }

  /* ───────────── Galeria + lightbox ───────────── */
  var gallery = document.querySelector('[data-gallery]');
  var lightbox = document.querySelector('[data-lightbox]');
  if (gallery && lightbox) {
    var links = [].slice.call(gallery.querySelectorAll('[data-gallery-item]:not([data-empty])'));
    var lbImg = lightbox.querySelector('img');
    var current = 0;
    var lastFocus = null;

    var show = function (i) {
      current = (i + links.length) % links.length;
      lbImg.src = links[current].getAttribute('href');
      lbImg.alt = links[current].getAttribute('aria-label') || '';
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('[data-lightbox-close]').focus();
    };
    var close = function () {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    gallery.querySelectorAll('[data-gallery-item]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        if (a.hasAttribute('data-empty')) return;
        open(links.indexOf(a));
      });
    });
    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', close);
    lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', function () { show(current - 1); });
    lightbox.querySelector('[data-lightbox-next]').addEventListener('click', function () { show(current + 1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    window.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
      // Prosta pułapka na fokus wewnątrz lightboxa.
      if (e.key === 'Tab') {
        var f = lightbox.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
