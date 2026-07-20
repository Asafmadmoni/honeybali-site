/**
 * routing.config.js — the rules that pick ONE of the 3 products.
 * The engine (quiz/assets/routing.js) reads this; it holds no hard-coded logic itself.
 *
 * reasonCodes explain WHY a route was chosen (saved with the lead / analytics):
 *   PRIVATE_LUXURY_MATCH, PRIVATE_BUDGET_MATCH, SIGNATURE_VALUE_MATCH,
 *   VISA_ONLY_EXPLICIT, VISA_ONLY_ALREADY_PLANNED
 */

export const ROUTING_CONFIG = {
  packages: ['private', 'signature', 'visa'],

  // Priority rules run in order BEFORE scoring. First match wins.
  priorityRules: [
    {
      // 1) Explicit "I only need a visa" always wins.
      id: 'visa_explicit',
      when: { flag: 'visaExplicit' },
      route: 'visa',
      reason: 'VISA_ONLY_EXPLICIT',
    },
    {
      // Already-planned + booked lodging + not asking for full planning → visa.
      id: 'visa_already_planned',
      when: { flag: 'alreadyPlanned', notWantsFullService: true, lodging: 'booked' },
      route: 'visa',
      reason: 'VISA_ONLY_ALREADY_PLANNED',
    },
  ],

  // Private requires BOTH a style match AND a budget match (per brief rule #2).
  privateGate: {
    styleMatch: ['ultra'],            // q5 style
    lodgingMatch: ['best'],           // q6 lodging
    budgetMatch: ['private', 'flexible'], // q9 budgetSegment
    // Private wins only if it also leads the score by this margin.
    minScore: 5,
    reasonLuxury: 'PRIVATE_LUXURY_MATCH',
    reasonBudget: 'PRIVATE_BUDGET_MATCH',
  },

  // Anyone who wants full planning but doesn't clear the Private gate → Signature (rule #3).
  signatureFallback: {
    reason: 'SIGNATURE_VALUE_MATCH',
  },

  // Default when scores are inconclusive.
  defaultRoute: 'signature',
  defaultReason: 'SIGNATURE_VALUE_MATCH',

  // Lead-temperature segmentation: soft/undecided answers accumulate an "explorer" score.
  // At/above the threshold the lead still gets the SAME package page, but with a soft
  // personal-offer CTA instead of the deposit checkout — nurture, not expulsion.
  explorer: {
    threshold: 3,
    reason: 'EXPLORER_NURTURE',
  },
};

export default ROUTING_CONFIG;
