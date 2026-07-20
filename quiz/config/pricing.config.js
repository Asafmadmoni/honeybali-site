/**
 * pricing.config.js — CLIENT-FACING pricing only.
 *
 * ⛔ INTERNAL COSTS ARE NOT AND MUST NOT BE IN THIS FILE (or anywhere in client code).
 *    HoneyBali's internal per-couple costs (Private tier, IL/foreign passports, Signature
 *    estimates) live ONLY in a secured backend that this static project does not have.
 *    Because there is no suitable backend, per the brief they are omitted entirely.
 *    See INTERNAL-COSTS.md (git-ignored, never deployed) for the handoff note.
 *
 * Retail prices below are PLACEHOLDERS (null) until the team sets them. While a retail
 * price is null:
 *   - development: an admin-only DEV badge is shown ("PRICE PENDING: <KEY>").
 *   - production: NO invented number is shown; the result CTA becomes "personal offer"
 *     (lead + WhatsApp handoff) instead of a checkout with a fake amount.
 */

// ---- Retail sale prices (what the customer pays), USD. Fill when finalized. ----
export const RETAIL = {
  // HoneyBali Private
  PRIVATE_RETAIL_PRICE_10_DAYS: null,
  PRIVATE_RETAIL_PRICE_14_DAYS: null,
  PRIVATE_RETAIL_PRICE_21_DAYS: null,
  // HoneyBali Signature
  SIGNATURE_RETAIL_PRICE_10_DAYS: null,
  SIGNATURE_RETAIL_PRICE_14_DAYS: null,
  SIGNATURE_RETAIL_PRICE_21_DAYS: null,
};

// ---- Reservation deposit ("שריון מקום") ----
// Charged at the funnel level for Private/Signature to reserve the spot; credited
// against the final trip price. ⚠️ CONFIRM the amount with the business — editable here.
export const DEPOSIT = {
  amount: 200,          // USD — confirmed by the business (influencer campaign)
  currency: 'USD',
  appliesTo: ['private', 'signature', 'visa'],
};

// ---- Visa Only — a real, client-facing price provided by the business. ----
// Dynamic by number of applicants. This is a sale price and MAY be shown.
export const VISA = {
  PRICE_PER_APPLICANT: 1190,        // base, per person
  PROMO_PRICE_PER_APPLICANT: 990,   // scratch-card campaign benefit
  currency: 'USD',
  priceFor(applicants, promo) {
    var n = Math.max(1, parseInt(applicants, 10) || 1);
    var unit = promo ? this.PROMO_PRICE_PER_APPLICANT : this.PRICE_PER_APPLICANT;
    return { applicants: n, unit: unit, baseUnit: this.PRICE_PER_APPLICANT, promo: !!promo, total: n * unit };
  },
};

// ---- Budget-range question options. Placeholders until retail tiers exist. ----
// These map a chosen band to a routing segment; they are NOT internal costs.
export const BUDGET_RANGES = {
  BUDGET_RANGE_LOW: { id: 'low', min: null, max: null, segment: 'signature' },
  BUDGET_RANGE_SIGNATURE: { id: 'signature', min: null, max: null, segment: 'signature' },
  BUDGET_RANGE_PRIVATE: { id: 'private', min: null, max: null, segment: 'private' },
  BUDGET_RANGE_FLEXIBLE: { id: 'flexible', min: null, max: null, segment: 'flexible' },
};

/**
 * getRetailPrice(pkg, duration) -> { key, amount|null, pending:boolean }
 * pkg: 'private' | 'signature'; duration: 10 | 14 | 21
 */
export function getRetailPrice(pkg, duration) {
  var key = pkg.toUpperCase() + '_RETAIL_PRICE_' + duration + '_DAYS';
  var amount = Object.prototype.hasOwnProperty.call(RETAIL, key) ? RETAIL[key] : null;
  return { key: key, amount: amount, pending: amount == null };
}

export default { RETAIL, VISA, BUDGET_RANGES, getRetailPrice };
