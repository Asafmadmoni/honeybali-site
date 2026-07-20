/* HoneyBali — restores interactivity on the static clone (Next.js does not hydrate). */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    try { initDestinations(); } catch (e) { console.warn('destinations', e); }
    try { initAccordions(); } catch (e) { console.warn('accordions', e); }
    try { initMobileMenu(); } catch (e) { console.warn('mobilemenu', e); }
    try { initSmoothScroll(); } catch (e) { console.warn('smoothscroll', e); }
  });

  /* ---------- Destinations expanding carousel (desktop) ---------- */
  function initDestinations() {
    var panels = [].slice.call(document.querySelectorAll('[data-destination]'));
    if (panels.length < 2) return;
    var track = panels[0].parentElement;

    // Build name -> description map from any panel/card containing h3 + p
    var descMap = {};
    [].slice.call(document.querySelectorAll('[role="button"]')).forEach(function (c) {
      var h = c.querySelector('h3'), p = c.querySelector('p');
      if (h && p) {
        var name = h.textContent.trim();
        if (name && !descMap[name]) descMap[name] = p.textContent.trim();
      }
    });

    // Normalize every panel so it has a vertical label (.hb-label) and a description block (.hb-desc)
    panels.forEach(function (panel) {
      panel.style.flex = '1 1 0%';

      var name = '';
      var existingH3 = panel.querySelector('h3');
      var vspan = panel.querySelector('span[style*="vertical"]');
      if (vspan) name = vspan.textContent.trim();
      else if (existingH3) name = existingH3.textContent.trim();

      // ensure label wrap
      var labelWrap = panel.querySelector('.hb-label');
      if (!labelWrap) {
        labelWrap = document.createElement('div');
        labelWrap.className = 'hb-label absolute inset-x-0 bottom-0 z-10 flex items-center justify-center pb-6';
        var sp = document.createElement('span');
        sp.className = 'text-lg font-semibold text-white';
        sp.style.writingMode = 'vertical-rl';
        sp.style.transform = 'rotate(180deg)';
        sp.textContent = name;
        labelWrap.appendChild(sp);
        panel.appendChild(labelWrap);
      }

      // ensure description block
      var descWrap = panel.querySelector('.hb-desc');
      if (!descWrap) {
        descWrap = document.createElement('div');
        descWrap.className = 'hb-desc absolute inset-x-0 bottom-0 z-10 p-8 text-white lg:p-10';
        descWrap.style.opacity = '0';
        descWrap.innerHTML =
          '<h3 class="font-heading text-3xl font-bold lg:text-4xl"></h3>' +
          '<p class="mt-3 max-w-md text-sm leading-relaxed text-white/75 lg:text-base"></p>';
        descWrap.querySelector('h3').textContent = name;
        descWrap.querySelector('p').textContent = descMap[name] || '';
        panel.appendChild(descWrap);
      }

      // shadow layer for active
      if (!panel.querySelector('.hb-shadow')) {
        var sh = document.createElement('div');
        sh.className = 'hb-shadow absolute inset-0 rounded-2xl';
        sh.style.boxShadow = 'rgba(0,0,0,.2) 12px 40px 40px';
        sh.style.opacity = '0';
        sh.style.transition = 'opacity .5s ease';
        sh.style.pointerEvents = 'none';
        panel.insertBefore(sh, panel.querySelector('.hb-label') || null);
      }
    });

    // Dots
    var dotWrap = track.parentElement.querySelector('.justify-center') ||
      track.parentElement.querySelector('[class*="justify-center"]');
    var dots = dotWrap ? [].slice.call(dotWrap.querySelectorAll('button')) : [];

    var current = -1;
    var timer = null;

    function setActive(i, fromUser) {
      if (i === current) return;
      current = i;
      panels.forEach(function (panel, idx) {
        var active = idx === i;
        panel.style.flex = active ? '4 1 0%' : '1 1 0%';
        panel.setAttribute('aria-expanded', active ? 'true' : 'false');
        var label = panel.querySelector('.hb-label');
        var desc = panel.querySelector('.hb-desc');
        var shadow = panel.querySelector('.hb-shadow');
        var video = panel.querySelector('video');
        var bg = panel.querySelector('[style*="background-image"]');
        if (label) label.style.opacity = active ? '0' : '1';
        if (desc) desc.style.opacity = active ? '1' : '0';
        if (shadow) shadow.style.opacity = active ? '1' : '0';
        if (video) {
          if (active) {
            video.style.opacity = '1';
            if (video.preload === 'none') video.preload = 'auto';
            var pr = video.play();
            if (pr && pr.catch) pr.catch(function () {});
          } else {
            video.style.opacity = '0';
            try { video.pause(); } catch (e) {}
          }
        }
        if (bg) bg.style.opacity = active ? '0' : '1';
      });
      dots.forEach(function (dot, idx) {
        var span = dot.querySelector('span');
        if (!span) return;
        var active = idx === i;
        span.style.width = active ? '32px' : '8px';
        span.className = 'block h-2 rounded-full ' + (active ? 'bg-white' : 'bg-white/30');
      });
    }

    panels.forEach(function (panel, idx) {
      panel.addEventListener('click', function () { setActive(idx, true); restart(); });
      panel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(idx, true); restart(); }
      });

      // Hover: play this strip's video even when collapsed (matches original)
      var video = panel.querySelector('video');
      var bg = panel.querySelector('[style*="background-image"]');
      panel.addEventListener('mouseenter', function () {
        if (idx === current) return; // active already plays
        if (video) {
          video.style.opacity = '1';
          if (video.preload === 'none') video.preload = 'auto';
          var pr = video.play();
          if (pr && pr.catch) pr.catch(function () {});
        }
        if (bg) bg.style.opacity = '0';
      });
      panel.addEventListener('mouseleave', function () {
        if (idx === current) return; // keep active playing
        if (video) { video.style.opacity = '0'; try { video.pause(); } catch (e) {} }
        if (bg) bg.style.opacity = '1';
      });
    });
    dots.forEach(function (dot, idx) {
      dot.addEventListener('click', function () { setActive(idx, true); restart(); });
    });

    function next() { setActive((current + 1) % panels.length); }
    function start() { stop(); timer = setInterval(next, 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);

    // start on the SSR-expanded one if present, else first
    var initial = panels.findIndex(function (p) { return p.getAttribute('aria-expanded') === 'true'; });
    setActive(initial >= 0 ? initial : 0);
    start();
  }

  /* ---------- Accordions (services, mobile + desktop) ---------- */
  function initAccordions() {
    var services = window.HB_SERVICES || {};
    var serviceKeys = Object.keys(services);

    // An accordion button has a "number" span + a title span + a +/- icon.
    var buttons = [].slice.call(document.querySelectorAll('button[aria-expanded]'))
      .filter(function (b) { return !b.getAttribute('aria-controls'); }) // exclude hamburger
      .filter(function (b) {
        return b.querySelector('[aria-hidden="true"]') && /^\d/.test(b.textContent.trim());
      });
    if (!buttons.length) return;

    // group buttons by their accordion container so indexes map to service order
    var groups = [];
    buttons.forEach(function (b) {
      var container = b.parentElement && b.parentElement.parentElement;
      var g = groups.filter(function (x) { return x.container === container; })[0];
      if (!g) { g = { container: container, btns: [] }; groups.push(g); }
      g.btns.push(b);
    });

    groups.forEach(function (g) {
      g.btns.forEach(function (btn, idx) {
        if (!btn.nextElementSibling) injectContent(btn, serviceKeys[idx], services);
      });
    });

    buttons.forEach(function (btn) {
      var content = btn.nextElementSibling;
      if (!content) return;
      content.classList.add('hb-acc-content');
      var icon = btn.querySelector('[aria-hidden="true"]');
      if (icon) icon.classList.add('hb-acc-icon');

      var expanded = btn.getAttribute('aria-expanded') === 'true';
      setOpen(btn, content, icon, expanded, false);

      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        // close siblings within same accordion group
        var group = btn.closest('div');
        var parent = group ? group.parentElement : null;
        if (parent) {
          [].slice.call(parent.querySelectorAll('button[aria-expanded]')).forEach(function (other) {
            if (other !== btn && !other.getAttribute('aria-controls')) {
              setOpen(other, other.nextElementSibling, other.querySelector('[aria-hidden="true"]'), false, true);
            }
          });
        }
        setOpen(btn, content, icon, willOpen, true);
      });
    });

    function setOpen(btn, content, icon, open, animate) {
      if (!content) return;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (icon) icon.style.transform = open ? 'rotate(45deg)' : 'rotate(0deg)';
      if (open) {
        content.style.opacity = '1';
        content.style.height = content.scrollHeight + 'px';
        if (animate) {
          var done = function () { content.style.height = 'auto'; content.removeEventListener('transitionend', done); };
          content.addEventListener('transitionend', done);
        } else {
          content.style.height = 'auto';
        }
      } else {
        if (content.style.height === 'auto' || content.style.height === '') {
          content.style.height = content.scrollHeight + 'px';
          void content.offsetHeight; // reflow
        }
        content.style.height = '0px';
        content.style.opacity = '0';
      }
    }

    function injectContent(btn, key, services) {
      var svc = key && services[key];
      if (!svc) return;
      var R2 = 'https://pub-eb375a42182a4d73bca347a222e87d36.r2.dev/videos/services/';
      var media = svc.media || key;
      var content = document.createElement('div');
      content.className = 'overflow-hidden';
      var paras = (svc.description || '').split('\n').filter(Boolean)
        .map(function (t) { return '<p>' + escapeHtml(t) + '</p>'; }).join('');
      content.innerHTML =
        '<div class="pb-6">' +
          '<div class="aspect-[4/3] overflow-hidden rounded-xl"><div class="h-full w-full">' +
            '<video muted loop playsinline preload="none" poster="images/services/' + media + '.jpg" class="h-full w-full object-cover">' +
              '<source src="' + R2 + media + '.mp4" type="video/mp4"></video>' +
          '</div></div>' +
          '<div class="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground-muted">' + paras + '</div>' +
          (svc.cta ? '<a href="#contact" class="mt-3 inline-flex items-center gap-1 text-[14px] font-medium text-brand">' +
            escapeHtml(svc.cta) + '<span aria-hidden="true" class="text-[16px]">›</span></a>' : '') +
        '</div>';
      btn.parentElement.insertBefore(content, btn.nextSibling);
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var burger = document.querySelector('button[aria-controls="mobile-menu"], button[aria-label="פתח תפריט"]');
    if (!burger) return;

    // gather nav links from the desktop nav
    var header = burger.closest('header') || document;
    var links = [].slice.call(header.querySelectorAll('a[href], button'))
      .filter(function (el) {
        if (el === burger) return false;
        var t = el.textContent.trim();
        return t && t.length < 24 && !/דף הבית|HoneyBali/.test(el.getAttribute('aria-label') || '') && !el.querySelector('img,svg');
      });

    var menu = document.createElement('nav');
    menu.id = 'hb-mobile-menu';
    var seen = {};
    links.forEach(function (l) {
      var t = l.textContent.trim();
      if (!t || seen[t]) return; seen[t] = 1;
      var item;
      if (l.tagName === 'A') {
        item = document.createElement('a');
        item.href = l.getAttribute('href');
      } else {
        item = document.createElement('button');
        item.addEventListener('click', function () { l.click(); });
      }
      item.textContent = t;
      item.addEventListener('click', close);
      menu.appendChild(item);
    });
    document.body.appendChild(menu);

    function open() {
      menu.classList.add('hb-open');
      menu.style.opacity = '1';
      menu.style.pointerEvents = 'auto';
      burger.classList.add('hb-burger-open');
      burger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      menu.classList.remove('hb-open');
      menu.style.opacity = '0';
      menu.style.pointerEvents = 'none';
      burger.classList.remove('hb-burger-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    burger.addEventListener('click', function () {
      if (menu.classList.contains('hb-open')) close(); else open();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- Smooth anchor scroll ---------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var hash = href.indexOf('#') >= 0 ? href.slice(href.indexOf('#')) : '';
      if (!hash || hash === '#') return;
      // only same-page anchors (strip the asafmadmoni.github.io origin)
      var samePage = /#/.test(href) && (href.indexOf('#') === 0 || /asafmadmoni\.github\.io|localhost|^\//.test(href) || href.indexOf('http') !== 0);
      var target = document.querySelector(hash) || document.getElementById(hash.slice(1));
      if (target && samePage) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }
})();
