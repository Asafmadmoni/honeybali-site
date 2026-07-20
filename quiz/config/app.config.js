/**
 * app.config.js — central app / environment configuration.
 * Edit business-wiring here, never inside components.
 */

// 'development' shows admin-only DEV warnings (e.g. missing retail price, simulated payment).
// 'production' never shows a made-up value to a user.
// Auto-detected from hostname; override with ?env=development for on-site QA.
function detectEnv() {
  try {
    var q = new URLSearchParams(location.search).get('env');
    if (q === 'development' || q === 'production') return q;
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) return 'development';
    // GitHub Pages preview is treated as staging → development warnings on, so the team
    // can see missing-price placeholders. Flip to 'production' before the real campaign.
    return 'development';
  } catch (e) { return 'production'; }
}

function detectDebug() {
  try { return new URLSearchParams(location.search).get('debug') === '1'; } catch (e) { return false; }
}

export const APP_CONFIG = {
  env: detectEnv(),
  isDev() { return this.env === 'development'; },
  // Visual debug overlays (media chips, routing banner) — only with ?debug=1,
  // so normal viewing stays clean even in the development environment.
  showDebug: detectDebug(),

  // Default language for the general /quiz link. Influencer link forces ar via ?lang=ar.
  defaultLang: 'he',
  supportedLangs: ['he', 'ar'],
  rtlLangs: ['he', 'ar'],

  // Session lifetime for saved quiz state (ms). After this, a fresh visit starts clean.
  sessionTtlMs: 1000 * 60 * 60 * 24, // 24h

  // Estimated quiz duration shown on the landing screen.
  estimatedMinutes: [1, 2],

  currency: 'USD',
  currencySymbol: '$',

  // Storage keys (namespaced).
  storageKeys: {
    state: 'hb_quiz_state_v1',
    lang: 'hb_lang',
  },
};

export default APP_CONFIG;
