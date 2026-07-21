/**
 * i18n.js — central translation system (he + ar), RTL-aware.
 * - Resolves initial language: ?lang → saved → campaign default.
 * - Loads /quiz/locales/<lang>.json once, caches it.
 * - t('a.b.c', vars) with {var} interpolation and graceful fallback.
 * - Switching language never resets quiz answers (state is separate).
 */
import APP_CONFIG from '../config/app.config.js?v=42';
import Store from './state.js?v=42';

var BASE = null; // resolved by app bootstrap (site-relative path to /quiz)
var dict = {};
var current = null;

function localeUrl(lang) { return (BASE || '.') + '/locales/' + lang + '.json?v=42'; }

export const I18n = {
  setBase: function (b) { BASE = b; },

  resolveInitialLang: function () {
    var q;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { q = null; }
    var saved = Store.getLanguage() || (function () {
      try { return localStorage.getItem(APP_CONFIG.storageKeys.lang); } catch (e) { return null; }
    })();
    var lang = [q, saved, APP_CONFIG.defaultLang].find(function (l) {
      return l && APP_CONFIG.supportedLangs.indexOf(l) >= 0;
    }) || APP_CONFIG.defaultLang;
    return lang;
  },

  load: async function (lang) {
    if (APP_CONFIG.supportedLangs.indexOf(lang) < 0) lang = APP_CONFIG.defaultLang;
    if (!dict[lang]) {
      var res = await fetch(localeUrl(lang), { cache: 'no-cache' });
      dict[lang] = await res.json();
    }
    current = lang;
    Store.setLanguage(lang);
    try { localStorage.setItem(APP_CONFIG.storageKeys.lang, lang); } catch (e) {}
    this.applyDir();
    return dict[lang];
  },

  get lang() { return current; },
  isRtl: function () { return APP_CONFIG.rtlLangs.indexOf(current) >= 0; },

  applyDir: function () {
    var dir = this.isRtl() ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', current);
    document.documentElement.setAttribute('dir', dir);
  },

  // t('quiz.q1.couple', {name:'Amna'})
  t: function (key, vars) {
    var val = lookup(dict[current], key);
    if (val == null) val = lookup(dict[APP_CONFIG.defaultLang], key); // fallback lang
    if (val == null) return APP_CONFIG.isDev() ? '⟨' + key + '⟩' : ''; // dev shows missing keys
    if (vars) {
      val = String(val).replace(/\{(\w+)\}/g, function (_, k) {
        return (vars[k] != null) ? vars[k] : '{' + k + '}';
      });
    }
    return val;
  },

  // Return an array translation (e.g. multi-paragraph), else [] .
  tList: function (key) {
    var val = lookup(dict[current], key);
    if (val == null) val = lookup(dict[APP_CONFIG.defaultLang], key);
    return Array.isArray(val) ? val : (val != null ? [val] : []);
  },

  // Does a key exist (in current or fallback locale)?
  has: function (key) {
    if (lookup(dict[current], key) != null) return true;
    return lookup(dict[APP_CONFIG.defaultLang], key) != null;
  },

  // Missing-key audit for QA.
  missingKeys: function (keys) {
    var miss = [];
    keys.forEach(function (k) { if (lookup(dict[current], k) == null) miss.push(k); });
    return miss;
  },
};

function lookup(obj, path) {
  if (!obj) return null;
  var parts = path.split('.');
  var cur = obj;
  for (var i = 0; i < parts.length; i++) {
    if (cur == null || typeof cur !== 'object') return null;
    cur = cur[parts[i]];
  }
  return cur === undefined ? null : cur;
}

export default I18n;
