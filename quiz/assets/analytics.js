/**
 * analytics.js — one façade for all tracking.
 * Fans each event out to whichever sinks are configured (GTM dataLayer, GA4, Meta Pixel).
 * - Strips PII (name/phone/email) before anything leaves.
 * - Dedupes once-only events (e.g. landing_view, quiz_complete, payment_success).
 * - No-ops safely when no IDs are set — nothing breaks in dev.
 */
import ANALYTICS from '../config/analytics.config.js?v=47';
import APP_CONFIG from '../config/app.config.js?v=47';

var loaded = { gtm: false, ga4: false, pixel: false };
var sentOnce = {};
var ONCE = ['landing_view', 'quiz_start', 'quiz_complete', 'quiz_loading_view',
  'payment_success', 'checkout_start'];

function scrub(payload) {
  var out = {};
  Object.keys(payload || {}).forEach(function (k) {
    if (ANALYTICS.piiFields.indexOf(k) >= 0) return;         // drop PII
    if (ANALYTICS.allowedFields.indexOf(k) >= 0) out[k] = payload[k];
    else if (APP_CONFIG.isDev()) out[k] = payload[k];         // dev: keep extras for debugging
  });
  return out;
}

function ensureSinks() {
  if (ANALYTICS.gtmId && !loaded.gtm) {
    window.dataLayer = window.dataLayer || [];
    injectScript('https://www.googletagmanager.com/gtm.js?id=' + ANALYTICS.gtmId);
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    loaded.gtm = true;
  }
  if (ANALYTICS.ga4Id && !loaded.ga4) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    injectScript('https://www.googletagmanager.com/gtag/js?id=' + ANALYTICS.ga4Id);
    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS.ga4Id, { send_page_view: false });
    loaded.ga4 = true;
  }
  if (ANALYTICS.metaPixelId && !loaded.pixel) {
    /* Standard Meta Pixel bootstrap */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', ANALYTICS.metaPixelId);
    loaded.pixel = true;
  }
}

function injectScript(src) {
  var s = document.createElement('script'); s.async = true; s.src = src;
  document.head.appendChild(s);
}

// Map our event names to Meta standard events where sensible.
var PIXEL_MAP = {
  landing_view: 'ViewContent', quiz_start: 'Lead', quiz_complete: 'CompleteRegistration',
  checkout_start: 'InitiateCheckout', payment_success: 'Purchase',
};

export const Analytics = {
  init: function () { ensureSinks(); },

  track: function (event, payload) {
    if (ANALYTICS.events.indexOf(event) < 0 && !APP_CONFIG.isDev()) return;
    if (ONCE.indexOf(event) >= 0) {
      if (sentOnce[event]) return;
      sentOnce[event] = true;
    }
    var data = scrub(payload || {});
    data.event = event;

    // GTM dataLayer
    if (window.dataLayer) window.dataLayer.push(Object.assign({}, data));
    // GA4
    if (window.gtag && ANALYTICS.ga4Id) window.gtag('event', event, data);
    // Meta Pixel (mapped)
    if (window.fbq && ANALYTICS.metaPixelId) {
      var mapped = PIXEL_MAP[event];
      var pix = {};
      if (data.value != null) { pix.value = data.value; pix.currency = data.currency || APP_CONFIG.currency; }
      if (mapped) window.fbq('track', mapped, pix);
      else window.fbq('trackCustom', event, data);
    }

    if (APP_CONFIG.isDev()) console.debug('[analytics]', event, data);
  },
};

export default Analytics;
