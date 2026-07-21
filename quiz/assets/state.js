/**
 * state.js — durable funnel state.
 * Survives refresh, back button, tab switch and language change (localStorage).
 * Captures & persists UTM/referrer on first load; never drops them on navigation.
 */
import APP_CONFIG from '../config/app.config.js?v=48';
import CAMPAIGN_CONFIG from '../config/campaign.config.js?v=48';
import QUIZ_STEPS, { REFINE_STEPS } from '../config/quiz.config.js?v=48';

var KEY = APP_CONFIG.storageKeys.state;

function now() { return Date.now(); }

function uid() {
  // Non-crypto session id; fine for analytics correlation.
  return 'hb_' + now().toString(36) + '_' + Math.floor(Math.random() * 1e9).toString(36);
}

function readRaw() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
}

function freshState() {
  return {
    version: 1,
    sessionId: uid(),
    createdAt: now(),
    updatedAt: now(),
    language: null,           // resolved by i18n
    answers: {},              // { stepId: optionId | [ids] | value }
    flags: {},                // routing flags (visaExplicit, alreadyPlanned…)
    facts: {},                // derived answer facts (duration, passportType…)
    lead: null,               // { fullName, phone, email, consent }
    selectedPackage: null,
    routingReasonCodes: [],
    payment: { status: 'none', transactionId: null, amount: null, currency: APP_CONFIG.currency },
    utm: {},
    referrer: '',
  };
}

var state = null;

function persist() {
  state.updatedAt = now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full / blocked */ }
}

function captureAttribution() {
  var params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = null; }
  var utm = Object.assign({}, state.utm);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    var v = params && params.get(k);
    if (v) utm[k] = v;
  });
  // Apply campaign defaults ONLY if nothing was captured at all (organic arrival stays clean).
  if (!utm.utm_source && !state.utm.utm_source) {
    // leave organic empty; do not fake influencer source
  }
  state.utm = utm;
  if (!state.referrer && document.referrer) state.referrer = document.referrer;
}

export const Store = {
  init: function () {
    var saved = readRaw();
    var expired = saved && (now() - (saved.createdAt || 0) > APP_CONFIG.sessionTtlMs);
    state = (saved && !expired && saved.version === 1) ? saved : freshState();
    captureAttribution(); // merges (never erases) UTM on every load
    persist();
    return state;
  },

  get: function () { return state || this.init(); },
  getSessionId: function () { return this.get().sessionId; },

  setLanguage: function (lang) { this.get().language = lang; persist(); },
  getLanguage: function () { return this.get().language; },

  // Save an answer. Facts/flags are DERIVED from the answers on every save —
  // never accumulated — so changing an earlier answer (back navigation) cleanly
  // un-sets whatever the old choice implied. `effects` param kept for call-site
  // compatibility; the source of truth is quiz.config.
  saveAnswer: function (stepId, value, effects) {
    var s = this.get();
    s.answers[stepId] = value;
    recomputeDerived(s);
    persist();
  },

  getAnswer: function (stepId) { return this.get().answers[stepId]; },
  hasAnswer: function (stepId) {
    var v = this.get().answers[stepId];
    return v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0);
  },

  // Manual facts (benefitClaimed, leadTemperature…) live outside the answers and
  // survive recompute.
  setFact: function (k, v) {
    var s = this.get();
    s.factsManual = s.factsManual || {};
    s.factsManual[k] = v;
    recomputeDerived(s);
    persist();
  },
  getFacts: function () { var s = this.get(); if (!s.factsComputed) recomputeDerived(s); return s.facts; },
  getFlags: function () { var s = this.get(); if (!s.factsComputed) recomputeDerived(s); return s.flags; },

  setLead: function (lead) { this.get().lead = lead; persist(); },
  setRouting: function (pkg, reasonCodes) {
    var s = this.get();
    s.selectedPackage = pkg;
    s.routingReasonCodes = reasonCodes || [];
    persist();
  },
  setPayment: function (p) { Object.assign(this.get().payment, p); persist(); },

  getUtm: function () { return this.get().utm; },
  getInfluencerContent: function () {
    var c = this.get().utm.utm_content;
    return CAMPAIGN_CONFIG.contentAttribution.indexOf(c) >= 0 ? c : null;
  },

  // Reset answers but PRESERVE attribution — UTM must survive everything (brief rule).
  reset: function () {
    var keepUtm = state ? state.utm : {};
    var keepRef = state ? state.referrer : '';
    var keepLang = state ? state.language : null;
    state = freshState();
    state.utm = keepUtm; state.referrer = keepRef; state.language = keepLang;
    persist(); return state;
  },
};

/* Replay every saved answer through the step configs → fresh facts + flags.
   Manual facts (setFact) are merged on top. */
function recomputeDerived(s) {
  var facts = {}, flags = {};
  var all = QUIZ_STEPS.concat(REFINE_STEPS);
  all.forEach(function (step) {
    if (!step.options) return;
    var chosen = s.answers[step.id];
    if (chosen == null) return;
    var ids = Array.isArray(chosen) ? chosen : [chosen];
    ids.forEach(function (id) {
      var opt = step.options.filter(function (o) { return o.id === String(id); })[0];
      if (!opt || !opt.effects) return;
      if (opt.effects.set) Object.keys(opt.effects.set).forEach(function (k) { facts[k] = opt.effects.set[k]; });
      if (opt.effects.flag) flags[opt.effects.flag] = true;
    });
  });
  // stepper answers carry their own numeric fact
  if (s.answers.q2_travelers != null) facts.travelersCount = parseInt(s.answers.q2_travelers, 10) || facts.travelersCount;
  // multi-select refine: priorities live as an array
  if (s.answers.qr1_priority != null) facts.priority = [].concat(s.answers.qr1_priority);
  Object.assign(facts, s.factsManual || {});
  s.facts = facts;
  s.flags = flags;
  s.factsComputed = true;
}

export default Store;
