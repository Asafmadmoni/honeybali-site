/**
 * payment.js — payment provider abstraction.
 * The project currently has NO live payment system and NO backend, so there is no real
 * charge and no server-side verification yet. This module:
 *   - Exposes a single createCheckout()/confirm() interface adapters plug into.
 *   - Ships a 'simulated' adapter used ONLY in development, clearly flagged.
 *   - Refuses to present a simulated charge as real in production.
 *
 * To go live: implement a real adapter (Stripe/Tranzila/Cardcom/…) that (a) creates the
 * charge server-side from a SECURE amount (never trust client/query params) and (b)
 * verifies success server-side before returning ok:true. Wire it via ADAPTER below and
 * provide keys through environment variables at build/deploy — never in this file.
 */
import APP_CONFIG from '../config/app.config.js?v=48';

// Selected provider adapter. 'simulated' | 'stripe' | 'tranzila' | ... (add real ones here)
export const PAYMENT_PROVIDER = 'simulated';

// --- Simulated adapter (development only) -------------------------------------
var simulatedAdapter = {
  id: 'simulated',
  live: false,
  async createCheckout(order) {
    // No network. Returns a local reference; UI must show a DEV warning.
    return { ok: true, ref: 'sim_' + Date.now().toString(36), order: order };
  },
  async confirm(ref, outcome) {
    // outcome: 'success' | 'fail' — driven by the dev test buttons.
    if (outcome === 'fail') return { ok: false, status: 'failed', ref: ref };
    return { ok: true, status: 'paid', ref: ref, transactionId: ref.toUpperCase().replace('SIM_', 'SIM-') };
  },
};

var ADAPTERS = { simulated: simulatedAdapter };

function activeAdapter() {
  return ADAPTERS[PAYMENT_PROVIDER] || simulatedAdapter;
}

export const Payment = {
  isLive: function () { return !!activeAdapter().live; },
  providerId: function () { return activeAdapter().id; },

  // Whether checkout can be presented as a real charge.
  canCharge: function () { return this.isLive(); },

  // In production with only a simulated adapter, we must NOT fake a live charge.
  // The UI should instead route to a personal-offer / lead flow.
  blockedInProd: function () { return !this.isLive() && !APP_CONFIG.isDev(); },

  createCheckout: function (order) { return activeAdapter().createCheckout(order); },
  confirm: function (ref, outcome) { return activeAdapter().confirm(ref, outcome); },
};

export default Payment;
