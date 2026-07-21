/**
 * state.js — durable funnel state.
 * Survives refresh, back button, tab switch and language change (localStorage).
 * Captures & persists UTM/referrer on first load; never drops them on navigation.
 */
import APP_CONFIG from '../config/app.config.js?v=40';
import CAMPAIGN_CONFIG from '../config/campaign.config.js?v=40';

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

  // Save an answer + apply its effects (facts/flags). Effects come from quiz.config.
  saveAnswer: function (stepId, value, effects) {
    var s = this.get();
    s.answers[stepId] = value;
    if (effects) applyEffects(s, effects);
    persist();
  },

  getAnswer: function (stepId) { return this.get().answers[stepId]; },
  hasAnswer: function (stepId) {
    var v = this.get().answers[stepId];
    return v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0);
  },

  setFact: function (k, v) { this.get().facts[k] = v; persist(); },
  getFacts: function () { return this.get().facts; },
  getFlags: function () { return this.get().flags; },

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

function applyEffects(s, effects) {
  if (effects.set) Object.keys(effects.set).forEach(function (k) { s.facts[k] = effects.set[k]; });
  if (effects.flag) s.flags[effects.flag] = true;
}

export default Store;
