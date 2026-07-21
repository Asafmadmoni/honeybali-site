/**
 * boot.js — tiny STABLE loader. This file must never change between releases.
 *
 * It fetches version.json with cache defeated, then loads the CSS + app module
 * graph pinned to that version. Result: even a stale cached index.html always
 * runs a single, consistent, current version — mixed-version screens are
 * structurally impossible.
 */
(function () {
  function start(v) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/funnel.css?v=' + v;
    document.head.appendChild(link);
    import('./app.js?v=' + v).catch(function (e) {
      document.getElementById('hb-app').innerHTML =
        '<p style="font-family:sans-serif;text-align:center;padding:40px">שגיאה בטעינה — רעננו את הדף</p>';
      if (window.console) console.error('boot failed', e);
    });
  }
  fetch('version.json?ts=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (j) { start(j.v); })
    .catch(function () { start('41'); }); // offline fallback: last known version
})();
