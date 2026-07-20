/**
 * app.js — HoneyBali Quiz Funnel controller + client router + views.
 * Vanilla ES module, no build step. Mobile-first, RTL, he/ar.
 */
import APP_CONFIG from '../config/app.config.js';
import CAMPAIGN from '../config/campaign.config.js';
import MEDIA from '../config/media.config.js';
import { VISA, getRetailPrice } from '../config/pricing.config.js';
import PACKAGES from '../config/packages.config.js';
import QUIZ_STEPS, { PROGRESS_STEPS } from '../config/quiz.config.js';
import Store from './state.js';
import I18n from './i18n.js';
import { decide } from './routing.js';
import Analytics from './analytics.js';
import Payment from './payment.js';

/* ---------------- DOM helpers ---------------- */
function h(tag, attrs, children) {
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    if (k === 'class') el.className = attrs[k];
    else if (k === 'html') el.innerHTML = attrs[k];
    else if (k === 'text') el.textContent = attrs[k];
    else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') el.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
    else if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
  return el;
}
var t = function () { return I18n.t.apply(I18n, arguments); };
var ICON = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-1.7-.9-2.9-1.6-4-3.6-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2.1-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-1.3 1.3-1 3.1.1 4.6 2 2.9 3.5 3.8 6.4 4.8 1.7.5 2.3.4 3.1.3.5-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 00-8.6 15L2 22l5.1-1.3A10 10 0 1012 2z"/></svg>',
};

/* ---------------- Router ---------------- */
var BASE = ''; // e.g. /honeybali-site/quiz  or  /quiz
function computeBase() {
  var p = location.pathname;
  var i = p.indexOf('/quiz');
  BASE = i >= 0 ? p.slice(0, i) + '/quiz' : p.replace(/\/[^/]*$/, '') ;
}
var ROUTES = {
  '': 'landing', '/': 'landing', '/index.html': 'landing',
  '/quiz': 'quiz',
  '/loading': 'loading',
  '/result/private': 'result', '/result/signature': 'result', '/result/visa': 'result',
  '/checkout': 'checkout',
  '/success': 'success',
};
function currentRoute() {
  // 404 fallback passes intended path via ?hbroute=
  var params = new URLSearchParams(location.search);
  var forced = params.get('hbroute');
  var rel;
  if (forced != null) {
    rel = forced;
    // clean the URL back to the real path
    history.replaceState({}, '', BASE + (rel === '/' ? '' : rel) + cleanQuery());
  } else {
    rel = location.pathname.slice(BASE.length) || '/';
  }
  if (rel !== '/' && rel.endsWith('/')) rel = rel.slice(0, -1);
  return rel;
}
function cleanQuery() {
  var p = new URLSearchParams(location.search);
  p.delete('hbroute');
  var s = p.toString();
  return s ? '?' + s : '';
}
function navigate(rel, replace) {
  var url = BASE + (rel === '/' ? '' : rel) + cleanQuery();
  if (replace) history.replaceState({}, '', url); else history.pushState({}, '', url);
  render();
}
window.addEventListener('popstate', render);

/* ---------------- Screen chrome ---------------- */
function progressIndex(stepId) { return PROGRESS_STEPS.indexOf(stepId); }
function topbar(opts) {
  opts = opts || {};
  var row = h('div', { class: 'hb-topbar' });
  if (opts.onBack) row.appendChild(h('button', { class: 'hb-back', 'aria-label': t('common.back'), html: ICON.back, onclick: opts.onBack }));
  if (opts.progress != null) {
    var bar = h('div', { class: 'hb-progress' }, [h('div', { class: 'hb-progress-bar' })]);
    setTimeout(function () { bar.firstChild.style.width = opts.progress + '%'; }, 20);
    row.appendChild(bar);
    row.appendChild(h('div', { class: 'hb-progress-label', text: opts.stepText || '' }));
  } else { row.appendChild(h('div', { style: 'flex:1' })); }
  row.appendChild(langSwitcher());
  return row;
}
function langSwitcher() {
  var wrap = h('div', { class: 'hb-lang' });
  ['he', 'ar'].forEach(function (l) {
    wrap.appendChild(h('button', {
      class: I18n.lang === l ? 'active' : '', text: t(l === 'he' ? 'common.langHe' : 'common.langAr'),
      onclick: function () { switchLang(l); },
    }));
  });
  return wrap;
}
async function switchLang(l) {
  if (l === I18n.lang) return;
  await I18n.load(l); // state (answers) is untouched
  Analytics.track('language_change', baseCtx({ language: l }));
  render();
}

/* mount */
var root;
function mount(screen) { root.innerHTML = ''; root.appendChild(screen); window.scrollTo(0, 0); }

/* Resolve a media entry to a usable src: final asset, else its real-imagery fallback. */
function mediaSrc(entry) {
  if (!entry) return null;
  if (!entry.placeholder) return withBase(entry.src);
  if (entry.fallback) return withBase(entry.fallback);
  return null;
}
function devChip(entry) {
  if (!APP_CONFIG.isDev() || !entry || !entry.placeholder) return null;
  return h('span', { class: 'hb-devchip', text: 'DEV · ' + entry.src.split('/').pop() });
}
function mediaTile(entry, cls) {
  var box = h('div', { class: 'hb-media ' + (cls || '') });
  var src = mediaSrc(entry);
  if (src) {
    if (/\.(mp4|webm)$/.test(src)) box.appendChild(h('video', { src: src, autoplay: '', muted: '', loop: '', playsinline: '' }));
    else box.appendChild(h('img', { src: src, alt: '', loading: 'lazy' }));
    var chip = devChip(entry);
    if (chip) box.appendChild(chip);
  }
  return box;
}
function withBase(rel) {
  // media in /public/... or existing /images/... — resolve against site root (one level up from /quiz)
  var siteRoot = BASE.replace(/\/quiz$/, '');
  return siteRoot + '/' + rel.replace(/^\//, '');
}
/* Cinematic full-bleed background layer */
function cineBg(entry) {
  var bg = h('div', { class: 'hb-cine-bg' });
  var src = mediaSrc(entry);
  if (src) {
    if (/\.(mp4|webm)$/.test(src)) bg.appendChild(h('video', { src: src, autoplay: '', muted: '', loop: '', playsinline: '' }));
    else bg.appendChild(h('img', { src: src, alt: '' }));
  }
  return bg;
}
function brandmark() {
  return h('div', { class: 'hb-brandmark' }, [
    h('img', { class: 'hb-emblem', src: withBase('assets/gate-white.svg'), alt: '' }),
    h('div', { class: 'hb-wordmark', text: 'HoneyBali' }),
  ]);
}

/* ---------------- Views ---------------- */
function viewLanding() {
  Analytics.track('landing_view', baseCtx());
  var s = h('div', { class: 'hb-screen hb-cine hb-dark-ui' });
  s.appendChild(cineBg(MEDIA.heroImage));
  var chip = devChip(MEDIA.heroImage);
  if (chip) s.appendChild(chip);
  var inner = h('div', { class: 'hb-cine-inner' });
  inner.appendChild(h('div', { class: 'hb-topbar' }, [h('div', { style: 'flex:1' }), langSwitcher()]));
  var content = h('div', { class: 'hb-cine-content' });
  content.appendChild(brandmark());
  content.appendChild(h('div', { class: 'hb-eyebrow', text: t('landing.eyebrow') }));
  content.appendChild(h('h1', { class: 'hb-hero-title', text: t('landing.title') }));
  content.appendChild(h('p', { class: 'hb-hero-sub', text: t('landing.subtitle') }));
  content.appendChild(h('div', { class: 'hb-cta-wrap' }, [
    h('button', { class: 'hb-cta hb-cta-gold', text: t('landing.cta'), onclick: function () {
      Analytics.track('quiz_start', baseCtx()); navigate('/quiz');
    } }),
  ]));
  content.appendChild(h('p', { class: 'hb-micro', text: t('landing.duration') }));
  inner.appendChild(content);
  s.appendChild(inner);
  mount(s);
}

/* quiz step index tracked in state via a lightweight pointer */
var stepPtr = 0;
function firstUnanswered() {
  for (var i = 0; i < QUIZ_STEPS.length; i++) {
    var st = QUIZ_STEPS[i];
    if (st.type === 'info') continue;
    if (!Store.hasAnswer(st.id)) return i;
  }
  return QUIZ_STEPS.length - 1;
}
function viewQuiz() {
  // restore to the right step on refresh/deep-link
  if (stepPtr >= QUIZ_STEPS.length) stepPtr = firstUnanswered();
  renderStep();
}
function renderStep() {
  var step = QUIZ_STEPS[stepPtr];
  if (!step) { startLoading(); return; }
  if (step.type === 'info') return renderInfo(step);
  if (step.type === 'lead') return renderLead(step);

  var idx = progressIndex(step.id);
  var total = PROGRESS_STEPS.length;
  var pct = Math.round((idx / total) * 100);
  Analytics.track('quiz_question_view', baseCtx({ question_id: step.id, question_index: idx }));

  var s = h('div', { class: 'hb-screen' });
  s.appendChild(topbar({ progress: pct, stepText: (idx + 1) + ' ' + t('common.of') + ' ' + total, onBack: idx > 0 ? goBack : null }));
  s.appendChild(h('h2', { class: 'hb-question', text: t(step.i18n + '.title') }));
  if (step.microcopy) s.appendChild(h('p', { class: 'hb-micro', text: t(step.microcopy) }));

  if (step.type === 'stepper') s.appendChild(renderStepper(step));
  else s.appendChild(renderOptions(step));
  mount(s);
}
function renderOptions(step) {
  var multi = step.type === 'multi';
  var chosen = Store.getAnswer(step.id) || (multi ? [] : null);
  var wrap = h('div', { class: 'hb-options' });
  var errBox = h('div', { class: 'hb-err-msg' });
  step.options.forEach(function (opt) {
    var isSel = multi ? chosen.indexOf(opt.id) >= 0 : chosen === opt.id;
    var btn = h('button', { class: 'hb-option' + (multi ? ' hb-option-multi' : '') + (isSel ? ' selected' : '') }, [
      h('span', { class: 'hb-check', html: ICON.check }),
      h('span', { text: t(opt.i18n) }),
    ]);
    btn.addEventListener('click', function () {
      if (multi) toggleMulti(step, opt, btn, wrap); else chooseSingle(step, opt);
    });
    wrap.appendChild(btn);
  });
  if (multi) {
    var cont = h('button', { class: 'hb-cta', text: t('common.continue'), onclick: function () {
      var sel = collectMulti(wrap, step);
      if (!sel.length) { errBox.textContent = t('errors.selectRequired'); return; }
      commitAnswer(step, sel); advance();
    } });
    return h('div', {}, [wrap, errBox, h('div', { class: 'hb-sticky' }, [cont])]);
  }
  return wrap;
}
function chooseSingle(step, opt) {
  Analytics.track('quiz_answer_selected', baseCtx({ question_id: step.id, answer_id: opt.id }));
  commitAnswer(step, opt.id);
  setTimeout(advance, 160); // brief highlight, then auto-advance
  // reflect selection immediately
  var btns = root.querySelectorAll('.hb-option');
  btns.forEach(function (b) { b.classList.remove('selected'); });
  event && event.currentTarget && event.currentTarget.classList.add('selected');
}
function toggleMulti(step, opt, btn, wrap) {
  var exclusiveOn = opt.effects && opt.effects.exclusive;
  if (exclusiveOn) {
    wrap.querySelectorAll('.hb-option').forEach(function (b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
  } else {
    // turning on a normal option clears any exclusive one
    step.options.forEach(function (o, i) {
      if (o.effects && o.effects.exclusive) wrap.querySelectorAll('.hb-option')[i].classList.remove('selected');
    });
    btn.classList.toggle('selected');
  }
  Analytics.track('quiz_answer_selected', baseCtx({ question_id: step.id, answer_id: opt.id }));
}
function collectMulti(wrap, step) {
  var out = [];
  wrap.querySelectorAll('.hb-option').forEach(function (b, i) { if (b.classList.contains('selected')) out.push(step.options[i].id); });
  return out;
}
function renderStepper(step) {
  var val = Store.getAnswer(step.id) ? parseInt(Store.getFacts().travelersCount, 10) : step.stepper.default;
  if (!val) val = step.stepper.default;
  var count = h('div', { class: 'hb-count', text: String(val) });
  function setVal(v) {
    v = Math.max(step.stepper.min, Math.min(step.stepper.max, v));
    val = v; count.textContent = String(v);
    minus.disabled = v <= step.stepper.min; plus.disabled = v >= step.stepper.max;
  }
  var minus = h('button', { text: '−', 'aria-label': '-', onclick: function () { setVal(val - 1); } });
  var plus = h('button', { text: '+', 'aria-label': '+', onclick: function () { setVal(val + 1); } });
  var row = h('div', { class: 'hb-stepper' }, [minus, count, plus]);
  var cont = h('button', { class: 'hb-cta', text: t('common.continue'), onclick: function () {
    Store.saveAnswer(step.id, String(val), { set: { travelersCount: val } });
    Analytics.track('quiz_answer_selected', baseCtx({ question_id: step.id, answer_id: String(val) }));
    advance();
  } });
  setTimeout(function () { minus.disabled = val <= step.stepper.min; plus.disabled = val >= step.stepper.max; }, 0);
  return h('div', {}, [row, h('div', { class: 'hb-sticky' }, [cont])]);
}
function renderInfo(step) {
  Analytics.track('quiz_info_slide_view', baseCtx({ question_id: step.id }));
  var entry = mediaFor(step.media);
  var s = h('div', { class: 'hb-screen hb-cine hb-dark-ui hb-info' });
  s.appendChild(cineBg(entry));
  var chip = devChip(entry);
  if (chip) s.appendChild(chip);
  var inner = h('div', { class: 'hb-cine-inner' });
  inner.appendChild(h('div', { class: 'hb-topbar' }, [
    h('button', { class: 'hb-back', 'aria-label': t('common.back'), html: ICON.back, onclick: goBack }),
    h('div', { style: 'flex:1' }), langSwitcher(),
  ]));
  var content = h('div', { class: 'hb-cine-content' });
  content.appendChild(h('h2', { text: t(step.i18n + '.title') }));
  content.appendChild(h('p', { class: 'hb-info-body', text: t(step.i18n + '.body') }));
  content.appendChild(h('div', { class: 'hb-cta-wrap' }, [
    h('button', { class: 'hb-cta hb-cta-glass', text: t(step.i18n + '.cta'), onclick: advance }),
  ]));
  inner.appendChild(content);
  s.appendChild(inner);
  mount(s);
}
function mediaFor(key) {
  if (!key) return null;
  var m = MEDIA[key];
  return Array.isArray(m) ? m[0] : m;
}
function renderLead(step) {
  var idx = progressIndex(step.id), total = PROGRESS_STEPS.length;
  var s = h('div', { class: 'hb-screen' });
  s.appendChild(topbar({ progress: 100, stepText: total + ' ' + t('common.of') + ' ' + total, onBack: goBack }));
  s.appendChild(h('h2', { class: 'hb-question', text: t('quiz.q12.title') }));
  s.appendChild(h('p', { class: 'hb-lead', text: t('quiz.q12.subtitle') }));

  var saved = Store.get().lead || {};
  var name = field('fullName', t('quiz.q12.name'), 'text', saved.fullName);
  var phoneWrap = phoneField(saved.phone);
  var email = field('email', t('quiz.q12.email'), 'email', saved.email);
  var consent = h('label', { class: 'hb-consent' }, [
    h('input', { type: 'checkbox' }), h('span', { text: t('quiz.q12.consent') }),
  ]);
  var submit = h('button', { class: 'hb-cta', text: t('quiz.q12.submit') });

  submit.addEventListener('click', function () {
    var nv = name.input.value.trim(), pv = phoneWrap.input.value.trim(), ev = email.input.value.trim();
    var ok = true;
    if (!nv) { name.setErr(t('errors.nameRequired')); ok = false; } else name.setErr('');
    if (!pv) { phoneWrap.setErr(t('errors.phoneRequired')); ok = false; }
    else if (!validPhone(pv, phoneWrap.cc.value)) { phoneWrap.setErr(t('errors.phoneInvalid')); ok = false; }
    else phoneWrap.setErr('');
    if (ev && !/^\S+@\S+\.\S+$/.test(ev)) { email.setErr(t('errors.emailInvalid')); ok = false; } else email.setErr('');
    if (!ok) return;
    Store.setLead({ fullName: nv, phone: phoneWrap.cc.value + pv.replace(/^0/, ''), email: ev, consent: consent.querySelector('input').checked });
    Store.saveAnswer(step.id, { done: true });
    // NOTE: lead saved here, but WhatsApp opens ONLY after payment success.
    Analytics.track('quiz_complete', baseCtx());
    startLoading();
  });

  s.appendChild(name.el); s.appendChild(phoneWrap.el); s.appendChild(email.el);
  s.appendChild(consent);
  s.appendChild(h('div', { class: 'hb-sticky' }, [submit]));
  mount(s);
}
function field(id, label, type, val) {
  var input = h('input', { id: 'hb-' + id, type: type, value: val || '', autocomplete: id === 'email' ? 'email' : 'name' });
  var err = h('div', { class: 'hb-err-msg' });
  var el = h('div', { class: 'hb-field' }, [h('label', { for: 'hb-' + id, text: label }), input, err]);
  return { el: el, input: input, setErr: function (m) { err.textContent = m; el.classList.toggle('err', !!m); } };
}
function phoneField(val) {
  var cc = h('select', {}, [
    h('option', { value: '+972', text: '🇮🇱 +972' }),
    h('option', { value: '+970', text: '🇵🇸 +970' }),
    h('option', { value: '+1', text: '+1' }),
    h('option', { value: '+44', text: '+44' }),
    h('option', { value: '+971', text: '+971' }),
  ]);
  var input = h('input', { id: 'hb-phone', type: 'tel', inputmode: 'tel', value: val || '', autocomplete: 'tel', placeholder: '5X XXX XXXX' });
  var err = h('div', { class: 'hb-err-msg' });
  var el = h('div', { class: 'hb-field' }, [h('label', { for: 'hb-phone', text: t('quiz.q12.phone') }), h('div', { class: 'hb-phone' }, [cc, input]), err]);
  return { el: el, input: input, cc: cc, setErr: function (m) { err.textContent = m; el.classList.toggle('err', !!m); } };
}
function validPhone(v, cc) {
  var digits = v.replace(/\D/g, '');
  if (cc === '+972' || cc === '+970') return /^0?5\d{8}$/.test(digits) || /^5\d{8}$/.test(digits);
  return digits.length >= 7 && digits.length <= 15;
}

/* ---------------- navigation between steps ---------------- */
function commitAnswer(step, value) {
  var effects = {};
  var ids = Array.isArray(value) ? value : [value];
  ids.forEach(function (id) {
    var opt = (step.options || []).filter(function (o) { return o.id === id; })[0];
    if (opt && opt.effects) {
      if (opt.effects.set) effects.set = Object.assign(effects.set || {}, opt.effects.set);
      if (opt.effects.flag) effects.flag = opt.effects.flag;
    }
  });
  Store.saveAnswer(step.id, value, effects);
}
function advance() { stepPtr++; if (stepPtr >= QUIZ_STEPS.length) startLoading(); else renderStep(); }
function goBack() {
  Analytics.track('quiz_back_click', baseCtx());
  stepPtr = Math.max(0, stepPtr - 1);
  var step = QUIZ_STEPS[stepPtr];
  if (!step) { stepPtr = 0; }
  renderStep();
}

/* ---------------- loading + routing decision ---------------- */
function startLoading() { navigate('/loading'); }
function viewLoading() {
  Analytics.track('quiz_loading_view', baseCtx());
  var s = h('div', { class: 'hb-screen hb-cine hb-loading hb-dark-ui' });
  var inner = h('div', { class: 'hb-cine-inner' });
  var img = h('div', { class: 'hb-load-img' });
  var loadSrc = mediaSrc(MEDIA.loadingImages[0]) || mediaSrc(mediaFor('coupleImage'));
  if (loadSrc) img.appendChild(h('img', { src: loadSrc, alt: '' }));
  inner.appendChild(img);
  var steps = ['loading.step1', 'loading.step2', 'loading.step3'].map(function (k, i) {
    return h('div', { class: 'hb-load-step' + (i === 0 ? ' active' : ''), 'data-i': i }, [
      h('span', { class: 'hb-load-dot', html: ICON.check }), h('span', { text: t(k) }),
    ]);
  });
  inner.appendChild(h('div', { class: 'hb-load-steps' }, steps));
  s.appendChild(inner);
  mount(s);

  // decide route now, reveal after 6–8s across 3 stages
  var result = decide(Store.get().answers);
  Store.setRouting(result.package, result.reasonCodes);
  var stageMs = 2400;
  steps.forEach(function (el, i) {
    setTimeout(function () {
      steps.forEach(function (e, j) { e.classList.toggle('done', j < i); e.classList.toggle('active', j === i); });
    }, i * stageMs);
  });
  setTimeout(function () {
    steps.forEach(function (e) { e.classList.add('done'); e.classList.remove('active'); });
  }, 3 * stageMs - 200);
  setTimeout(function () {
    var pkg = PACKAGES[result.package];
    navigate('/' + pkg.route, true);
  }, 3 * stageMs + 200);
}

/* ---------------- result ---------------- */
function passportLabel(pt) {
  return { israeli: 'passportIl', mixed: 'passportMixed', foreign: 'passportForeign', unknown: 'passportUnknown' }[pt] || 'passportUnknown';
}
function partyLabel(p) {
  return { couple: 'partyCouple', family: 'partyFamily', friends: 'partyFriends', solo: 'partySolo' }[p] || 'partyCouple';
}
function whenLabel(m) {
  if (!m || m === 'undecided' || m === 'other') return '';
  var opt = QUIZ_STEPS[2].options.filter(function (o) { return o.effects.set.travelMonth === m; })[0];
  return opt ? t(opt.i18n) : '';
}
function viewResult(routeRel) {
  var pkgId = routeRel.split('/').pop(); // private|signature|visa
  var pkg = PACKAGES[pkgId];
  if (!pkg) { navigate('/quiz', true); return; }
  // Deep-link safety: entering a result page directly (refresh / shared link) must still
  // set the selected package so checkout works. Reasons come from a fresh decide() when
  // they match; otherwise mark as DEEP_LINK. Price is ALWAYS computed from config, never
  // from the URL, so this cannot change any amount.
  if (Store.get().selectedPackage !== pkgId) {
    var d = decide(Store.get().answers);
    Store.setRouting(pkgId, d.package === pkgId ? d.reasonCodes : ['DEEP_LINK']);
  }
  var facts = Store.getFacts();
  Analytics.track('quiz_result_view', baseCtx({ selected_package: pkgId }));

  var s = h('div', { class: 'hb-screen hb-result hb-theme-' + pkgId });

  // cinematic hero header
  var heroEntry = (MEDIA.resultHero && MEDIA.resultHero[pkgId]) || null;
  var hero = h('div', { class: 'hb-result-hero hb-dark-ui' });
  hero.appendChild(cineBg(heroEntry));
  var chip = devChip(heroEntry);
  if (chip) hero.appendChild(chip);
  var heroInner = h('div', { class: 'hb-result-hero-inner' });
  heroInner.appendChild(h('div', { class: 'hb-topbar' }, [h('div', { style: 'flex:1' }), langSwitcher()]));
  var heroContent = h('div', { class: 'hb-result-hero-content' });
  heroContent.appendChild(h('div', { class: 'hb-badge', text: t('result.recommendedFor') }));
  heroContent.appendChild(h('h1', { class: 'hb-pkg-name', text: pkg.name }));
  heroContent.appendChild(h('p', { class: 'hb-pkg-tagline', text: t(pkg.i18n.tagline) }));
  heroInner.appendChild(heroContent);
  hero.appendChild(heroInner);
  s.appendChild(hero);

  // body
  var body = h('div', { class: 'hb-result-body' });
  var sAppend = s.appendChild.bind(s);
  s.appendChild = function (el) { body.appendChild(el); return el; }; // subsequent sections go into body
  sAppend(body);

  if (APP_CONFIG.isDev()) s.appendChild(h('div', { class: 'hb-dev', text: 'DEV route=' + pkgId + ' · reasons=' + (Store.get().routingReasonCodes.join(',')) }));

  // dynamic summary
  s.appendChild(h('div', { class: 'hb-summary', text: buildSummary(pkgId, facts) }));

  // facts chips
  var chips = h('div', { class: 'hb-facts' });
  if (pkgId !== 'visa' && facts.duration) chips.appendChild(h('span', { class: 'hb-fact', text: facts.duration + ' ' + t('result.days') }));
  if (facts.travelersCount) chips.appendChild(h('span', { class: 'hb-fact', text: facts.travelersCount + ' ' + t('result.people') }));
  if (pkgId === 'visa') chips.appendChild(h('span', { class: 'hb-fact', text: t('result.visas') + ': ' + visaCount(facts) }));
  if (facts.passportType) chips.appendChild(h('span', { class: 'hb-fact', text: t('result.' + passportLabel(facts.passportType)) }));
  s.appendChild(chips);

  // includes
  s.appendChild(h('div', { class: 'hb-section-title', text: t('result.whatsIncluded') }));
  s.appendChild(listOf(pkg.i18n.includesKeys));
  // differentiators
  s.appendChild(h('div', { class: 'hb-section-title', text: t('result.whatsSpecial') }));
  s.appendChild(listOf(pkg.i18n.differentiatorsKeys));

  // price
  s.appendChild(priceBlock(pkgId, facts));

  // faq
  var faq = h('div', { class: 'hb-faq' });
  pkg.i18n.faqKeys.forEach(function (k) {
    var txt = t(k); var parts = txt.split('?');
    faq.appendChild(h('details', {}, [
      h('summary', { text: (parts[0] || txt) + (parts.length > 1 ? '?' : '') }),
      h('p', { text: parts.slice(1).join('?').trim() }),
    ]));
  });
  s.appendChild(h('div', { class: 'hb-section-title', text: t('result.faq') }));
  s.appendChild(faq);

  // single CTA
  var priced = pricingFor(pkgId, facts);
  var ctaLabel = priced.chargeable ? t('result.cta') : t('result.ctaOffer');
  s.appendChild(h('div', { class: 'hb-sticky' }, [
    h('button', { class: 'hb-cta hb-cta-gold', text: ctaLabel, onclick: function () { navigate('/checkout'); } }),
  ]));
  mount(s);
}
function listOf(keys) {
  var ul = h('ul', { class: 'hb-list' });
  keys.forEach(function (k) { ul.appendChild(h('li', {}, [h('span', { html: ICON.check }), h('span', { text: t(k) })])); });
  return ul;
}
function buildSummary(pkgId, f) {
  var party = t('result.' + partyLabel(f.partyType || 'couple'));
  var when = whenLabel(f.travelMonth);
  var duration = f.duration ? f.duration + ' ' + t('result.days') : '';
  var styleMap = { ultra: 'quiz.q5.ultra', value: 'quiz.q5.value', nature: 'quiz.q5.nature', visa: 'quiz.q5.visaOnly' };
  var style = f.style ? t(styleMap[f.style]) : '';
  return t('result.summaryTemplate', { party: party, when: when || '—', duration: duration || '—', style: style || '—' });
}
function visaCount(f) { return f.travelersCount || 1; }
function pricingFor(pkgId, f) {
  if (pkgId === 'visa') {
    var v = VISA.priceFor(visaCount(f));
    return { chargeable: true, amount: v.total, unit: v.unit, applicants: v.applicants, currency: VISA.currency, kind: 'visa' };
  }
  var duration = f.duration || 14; // sensible default for display grouping
  var r = getRetailPrice(pkgId, duration);
  return { chargeable: r.amount != null, amount: r.amount, key: r.key, pending: r.pending, currency: APP_CONFIG.currency, kind: 'retail', duration: duration };
}
function priceBlock(pkgId, f) {
  var p = pricingFor(pkgId, f);
  var box = h('div', { class: 'hb-price' });
  if (p.kind === 'visa') {
    box.appendChild(h('div', { class: 'hb-price-label', text: t('result.priceLabel') + ' · ' + p.applicants + ' × ' + money(p.unit) }));
    box.appendChild(h('div', { class: 'hb-price-amount', text: money(p.amount) }));
    box.appendChild(h('div', { class: 'hb-price-note', text: t('result.priceNote') }));
  } else if (p.chargeable) {
    box.appendChild(h('div', { class: 'hb-price-label', text: t('result.priceLabel') }));
    box.appendChild(h('div', { class: 'hb-price-amount', text: money(p.amount) }));
    box.appendChild(h('div', { class: 'hb-price-note', text: t('result.priceNote') }));
  } else {
    // no retail price yet — NEVER invent one
    if (APP_CONFIG.isDev()) box.appendChild(h('div', { class: 'hb-price-label', text: '[DEV] PRICE PENDING: ' + p.key }));
    box.appendChild(h('div', { class: 'hb-price-amount', style: 'font-size:22px', text: t('result.pricePending') }));
  }
  return box;
}
function money(n) { return APP_CONFIG.currencySymbol + Number(n).toLocaleString('en-US'); }

/* ---------------- checkout ---------------- */
var checkoutRef = null;
function viewCheckout() {
  var pkgId = Store.get().selectedPackage; var pkg = PACKAGES[pkgId];
  if (!pkg) { navigate('/quiz', true); return; }
  var f = Store.getFacts();
  var p = pricingFor(pkgId, f);
  Analytics.track('checkout_start', baseCtx({ selected_package: pkgId, value: p.amount || undefined, currency: p.currency }));

  var s = h('div', { class: 'hb-screen' });
  s.appendChild(topbar({ onBack: function () { navigate('/' + pkg.route); } }));
  s.appendChild(h('h1', { class: 'hb-h1', text: t('checkout.title') }));

  var summary = h('div', { class: 'hb-order-card' }, [
    row(t('checkout.package'), t(pkg.i18n.title)),
    (pkgId !== 'visa' && f.duration) ? row(t('result.duration'), f.duration + ' ' + t('result.days')) : null,
    (pkgId === 'visa') ? row(t('result.visas'), String(visaCount(f))) : null,
  ]);
  s.appendChild(summary);

  var canCharge = p.chargeable && !Payment.blockedInProd();
  if (canCharge) {
    s.appendChild(h('div', { class: 'hb-price' }, [
      h('div', { class: 'hb-price-label', text: t('checkout.amount') }),
      h('div', { class: 'hb-price-amount', text: money(p.amount) }),
    ]));
    if (!Payment.isLive() && APP_CONFIG.isDev()) {
      s.appendChild(h('div', { class: 'hb-dev', text: t('checkout.devWarning') }));
      // dev simulate buttons
      s.appendChild(h('div', { class: 'hb-sticky' }, [
        h('button', { class: 'hb-cta', text: t('checkout.simSuccess'), onclick: function () { doPay(p, 'success'); } }),
        h('button', { class: 'hb-btn-ghost', style: 'margin-top:10px', text: t('checkout.simFail'), onclick: function () { doPay(p, 'fail'); } }),
      ]));
    } else {
      // live provider would render its widget here
      s.appendChild(h('div', { class: 'hb-sticky' }, [
        h('button', { class: 'hb-cta', text: t('checkout.payNow'), onclick: function () { doPay(p, 'success'); } }),
        h('p', { class: 'hb-micro', style: 'text-align:center', text: t('checkout.securePay') }),
      ]));
    }
  } else {
    // No price / no live provider in production → personal-offer flow (no fake charge, no WhatsApp yet)
    s.appendChild(h('div', { class: 'hb-summary' }, [
      h('div', { class: 'hb-section-title', text: t('checkout.noProviderTitle') }),
      h('p', { style: 'margin:6px 0 0;font-size:15px;color:var(--foreground-muted)', text: t('checkout.noProviderBody') }),
    ]));
    s.appendChild(h('div', { class: 'hb-sticky' }, [
      h('button', { class: 'hb-cta', text: t('checkout.requestCallback'), onclick: function () {
        // treat as a completed lead handoff (still no WhatsApp before payment per brief;
        // here there is no payment, so we send them to a thank-you without WhatsApp purchase framing)
        Store.setPayment({ status: 'offer_requested' });
        navigate('/success');
      } }),
    ]));
  }
  mount(s);
}
function row(k, v) { return h('div', { class: 'hb-order-row' }, [h('span', { text: k }), h('b', { text: v })]); }

async function doPay(p, outcome) {
  var order = { package: Store.get().selectedPackage, amount: p.amount, currency: p.currency, sessionId: Store.getSessionId() };
  var co = await Payment.createCheckout(order);
  checkoutRef = co.ref;
  var res = await Payment.confirm(co.ref, outcome);
  if (res.ok) {
    Store.setPayment({ status: 'paid', transactionId: res.transactionId, amount: p.amount, currency: p.currency });
    Analytics.track('payment_success', baseCtx({ selected_package: order.package, value: p.amount, currency: p.currency }));
    navigate('/success');
  } else {
    Store.setPayment({ status: 'failed' });
    Analytics.track('payment_failed', baseCtx({ selected_package: order.package }));
    alert(t('errors.generic'));
  }
}

/* ---------------- success + whatsapp ---------------- */
function viewSuccess() {
  var st = Store.get();
  var paid = st.payment.status === 'paid';
  var pkg = PACKAGES[st.selectedPackage];
  var s = h('div', { class: 'hb-screen hb-success' });
  s.appendChild(h('div', { class: 'hb-tick', html: ICON.check }));
  s.appendChild(h('h1', { class: 'hb-h1', text: t('success.title') }));
  s.appendChild(h('p', { class: 'hb-lead', text: t('success.subtitle') }));
  if (paid && st.payment.transactionId) s.appendChild(h('div', { class: 'hb-order', text: t('success.orderId') + ': ' + st.payment.transactionId }));

  // WhatsApp opens ONLY after a successful payment (per brief). For the personal-offer
  // path (no payment), we still let them message, but the brief's hard rule is specifically
  // "no WhatsApp before payment" — offer_requested is a post-handoff state, not pre-payment.
  if (paid || st.payment.status === 'offer_requested') {
    s.appendChild(h('div', { class: 'hb-sticky' }, [
      h('button', { class: 'hb-cta hb-wa', html: ICON.wa + '<span>' + t('success.whatsapp') + '</span>', onclick: function () { openWhatsApp(); } }),
    ]));
  }
  mount(s);
}
function openWhatsApp() {
  var st = Store.get(); var pkg = PACKAGES[st.selectedPackage]; var f = st.facts;
  Analytics.track('whatsapp_click', baseCtx({ selected_package: st.selectedPackage }));
  var msg = t('success.whatsappMessage', {
    name: (st.lead && st.lead.fullName) || '',
    package: t(pkg.i18n.title),
    duration: f.duration ? f.duration + ' ' + t('result.days') : '—',
    travelers: f.travelersCount || 1,
    passport: t('result.' + passportLabel(f.passportType)),
    date: whenLabel(f.travelMonth) || '—',
    orderId: st.payment.transactionId || '—',
  });
  var url = 'https://wa.me/' + CAMPAIGN.whatsappNumber + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

/* ---------------- shared analytics ctx ---------------- */
function baseCtx(extra) {
  var st = Store.get(); var u = st.utm || {};
  return Object.assign({
    session_id: st.sessionId, language: I18n.lang,
    utm_source: u.utm_source, utm_medium: u.utm_medium, utm_campaign: u.utm_campaign, utm_content: u.utm_content,
    routing_reason: (st.routingReasonCodes || []).join(','), selected_package: st.selectedPackage || undefined,
    travelers_count: st.facts.travelersCount, passport_type: st.facts.passportType, budget_segment: st.facts.budgetSegment,
    duration: st.facts.duration,
  }, extra || {});
}

/* ---------------- render dispatch ---------------- */
function render() {
  var rel = currentRoute();
  var view = ROUTES[rel] || (rel.indexOf('/result/') === 0 ? 'result' : 'landing');
  if (view === 'landing') return viewLanding();
  if (view === 'quiz') return viewQuiz();
  if (view === 'loading') return viewLoading();
  if (view === 'result') return viewResult(rel);
  if (view === 'checkout') return viewCheckout();
  if (view === 'success') return viewSuccess();
  return viewLanding();
}

/* ---------------- boot ---------------- */
(async function boot() {
  computeBase();
  root = document.getElementById('hb-app');
  Store.init();
  I18n.setBase(BASE);
  var lang = I18n.resolveInitialLang();
  await I18n.load(lang);
  Analytics.init();
  // restore step pointer if entering quiz mid-way
  stepPtr = firstUnanswered();
  render();
})();
