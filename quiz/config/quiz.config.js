/**
 * quiz.config.js — the funnel step sequence.
 *
 * Each step: { id, type, i18n, options[] }
 *   type: 'single' (auto-advance) | 'multi' (multi-select, needs Continue) |
 *         'stepper' | 'info' (interstitial) | 'lead' (contact form)
 *   Every option carries `effects` consumed ONLY by the routing engine
 *   (quiz/assets/routing.js). No routing logic lives in the UI.
 *
 * effects fields:
 *   score: { private?, signature?, visa? }  — additive weights
 *   set:   { key: value }                    — writes an answer flag (duration, passportType…)
 *   flag:  'visaExplicit' | 'alreadyPlanned' — boolean signals for priority rules
 *   exclusive: true                          — (multi) selecting it clears the others
 */

export const QUIZ_STEPS = [
  {
    id: 'q1_who', type: 'single', i18n: 'quiz.q1',
    options: [
      { id: 'couple',  i18n: 'quiz.q1.couple',  effects: { set: { partyType: 'couple' } } },
      { id: 'family',  i18n: 'quiz.q1.family',  effects: { set: { partyType: 'family' } } },
      { id: 'friends', i18n: 'quiz.q1.friends', effects: { set: { partyType: 'friends' } } },
      { id: 'solo',    i18n: 'quiz.q1.solo',    effects: { set: { partyType: 'solo' } } },
    ],
  },
  {
    id: 'q2_travelers', type: 'stepper', i18n: 'quiz.q2',
    stepper: { min: 1, max: 12, default: 2 },
    // stepper writes travelersCount; buckets are for analytics only
    options: [
      { id: '1',   i18n: 'quiz.q2.one',   effects: { set: { travelersCount: 1 } } },
      { id: '2',   i18n: 'quiz.q2.two',   effects: { set: { travelersCount: 2 } } },
      { id: '3-4', i18n: 'quiz.q2.threeFour', effects: { set: { travelersCount: 3 } } },
      { id: '5+',  i18n: 'quiz.q2.fivePlus',  effects: { set: { travelersCount: 5 } } },
    ],
  },
  {
    id: 'q3_when', type: 'single', i18n: 'quiz.q3',
    options: [
      { id: 'apr2027', i18n: 'quiz.q3.apr', effects: { set: { travelMonth: '2027-04' } } },
      { id: 'may2027', i18n: 'quiz.q3.may', effects: { set: { travelMonth: '2027-05' } } },
      { id: 'jun2027', i18n: 'quiz.q3.jun', effects: { set: { travelMonth: '2027-06' } } },
      { id: 'jul2027', i18n: 'quiz.q3.jul', effects: { set: { travelMonth: '2027-07' } } },
      { id: 'aug2027', i18n: 'quiz.q3.aug', effects: { set: { travelMonth: '2027-08' } } },
      { id: 'sep2027', i18n: 'quiz.q3.sep', effects: { set: { travelMonth: '2027-09' } } },
    ],
  },
  {
    id: 'q4_duration', type: 'single', i18n: 'quiz.q4',
    options: [
      { id: '10', i18n: 'quiz.q4.d10', effects: { set: { duration: 10 } } },
      { id: '14', i18n: 'quiz.q4.d14', effects: { set: { duration: 14 } } },
      { id: '21', i18n: 'quiz.q4.d21', effects: { set: { duration: 21 } } },
      { id: '21plus', i18n: 'quiz.q4.d21p', effects: { set: { duration: '21+' } } },
    ],
  },

  {
    // Two sharp styles, each with a 3-photo strip so the difference is VISIBLE.
    // Visa-only seekers are deliberately not served — no entry point for them.
    // PLACEHOLDER photos from the existing library — swap when Asaf sends finals.
    id: 'q5_style', type: 'single', i18n: 'quiz.q5',
    options: [
      { id: 'ultra',  i18n: 'quiz.q5.ultra',  effects: { score: { private: 3 }, set: { style: 'ultra' } },
        photos: ['images/brand/the-edge.webp', 'images/services/hotels.jpg', 'public/influencers/amna-amer/koi-boat.jpg'] },
      { id: 'nature', i18n: 'quiz.q5.nature', effects: { score: { signature: 2 }, set: { style: 'nature' } },
        photos: ['public/influencers/amna-amer/rice-terraces.jpg', 'public/influencers/amna-amer/jungle-walk.jpg', 'images/destinations/NusaPenida.jpg'] },
    ],
  },
  {
    // Two hotel tiers, photo-contrasted: the absolute top vs smart quality.
    // Both imply full service. PLACEHOLDER photos — swap when finals arrive.
    id: 'q6_lodging', type: 'single', i18n: 'quiz.q6',
    options: [
      { id: 'best',    i18n: 'quiz.q6.best',    effects: { score: { private: 3 }, set: { lodging: 'best', wantsFullService: true } },
        photos: ['images/brand/the-edge.webp', 'images/services/hotels.jpg', 'images/brand/changu-web.jpg'] },
      { id: 'quality', i18n: 'quiz.q6.quality', effects: { score: { signature: 3 }, set: { lodging: 'quality', wantsFullService: true } },
        photos: ['images/destinations/Ubud.jpg', 'images/destinations/Canggu.jpg', 'images/destinations/Sideman.jpg'] },
    ],
  },

  {
    id: 'info2', type: 'info', i18n: 'quiz.info2', media: 'signatureHotelImages',
    // what "we close everything" actually means — concrete, not a slogan
    checks: ['quiz.info2.checks.1', 'quiz.info2.checks.2', 'quiz.info2.checks.3', 'quiz.info2.checks.4'],
    // irrelevant for visa-only users — they skip straight on (shorter, smarter path)
    showIf: { notFlag: 'visaExplicit' },
    // Tier-matched messaging: premium signals (ultra style / best hotels) get the
    // chef-dinner pitch; value seekers get smart-choices language. The actual
    // Private/Signature routing happens at the result from these same signals.
    variants: [
      { when: { factIn: { style: ['ultra'] } },   i18n: 'quiz.info2.premium', media: 'premiumHotelImages' },
      { when: { factIn: { lodging: ['best'] } },  i18n: 'quiz.info2.premium', media: 'premiumHotelImages' },
      { when: { factIn: { wantsFullService: [true] } }, i18n: 'quiz.info2.full', media: 'premiumHotelImages' },
    ],
  },

  {
    id: 'q8_passport', type: 'single', i18n: 'quiz.q8', microcopy: 'quiz.q8.microcopy',
    options: [
      { id: 'il',      i18n: 'quiz.q8.il',      effects: { set: { passportType: 'israeli' } } },
      { id: 'mixed',   i18n: 'quiz.q8.mixed',   effects: { set: { passportType: 'mixed' } } },
      { id: 'foreign', i18n: 'quiz.q8.foreign', effects: { set: { passportType: 'foreign' } } },
    ],
  },

  // Objection-handling slide — right where the passport/timing objections are born.
  // No image here: the 3-step process IS the content, and it must fit one screen.
  {
    id: 'info3', type: 'info', i18n: 'quiz.info3',
    steps: ['quiz.info3.step1', 'quiz.info3.step2', 'quiz.info3.step3'],
    // reacts to WHICH passport they hold (q8)
    variants: [
      { when: { factIn: { passportType: ['foreign'] } }, i18n: 'quiz.info3.foreign' },
    ],
  },
  {
    // visa price is fixed — budget is meaningless on that path
    id: 'q9_budget', type: 'single', i18n: 'quiz.q9',
    showIf: { notFlag: 'visaExplicit' },
    options: [
      { id: 'b7',   i18n: 'quiz.q9.b7',   effects: { score: { signature: 3 }, set: { budgetSegment: 'signature' } } },
      { id: 'b15',  i18n: 'quiz.q9.b15',  effects: { score: { signature: 2, private: 1 }, set: { budgetSegment: 'flexible' } } },
      { id: 'b15p', i18n: 'quiz.q9.b15p', effects: { score: { private: 3 }, set: { budgetSegment: 'private' } } },
    ],
  },
  {
    id: 'q10_flights', type: 'single', i18n: 'quiz.q10',
    showIf: { notFlag: 'visaExplicit' },
    options: [
      { id: 'yes',     i18n: 'quiz.q10.yes',     effects: { set: { flightStatus: 'booked' } } },
      { id: 'notyet',  i18n: 'quiz.q10.notYet',  effects: { set: { flightStatus: 'not_yet' } } },
    ],
  },
  {
    id: 'q11_stage', type: 'single', i18n: 'quiz.q11',
    options: [
      { id: 'now',      i18n: 'quiz.q11.now',     effects: { score: { private: 1, signature: 1 }, set: { readiness: 'now' } } },
      { id: 'soon',     i18n: 'quiz.q11.soon',    effects: { set: { readiness: 'soon' } } },
    ],
  },
  {
    id: 'q12_lead', type: 'lead', i18n: 'quiz.q12',
    fields: [
      { id: 'fullName', i18n: 'quiz.q12.name',  type: 'text',  required: true },
      { id: 'phone',    i18n: 'quiz.q12.phone', type: 'tel',   required: true },
      { id: 'email',    i18n: 'quiz.q12.email', type: 'email', required: false },
    ],
    consent: { id: 'marketing', i18n: 'quiz.q12.consent', required: false, preChecked: true },
  },
];

// Refinement-loop questions (the "calculating…" engagement pattern): asked BETWEEN
// loading phases after the quiz ends. Data-only — they personalize the sales call,
// not the routing.
export const REFINE_STEPS = [
  {
    // multi-select: people care about more than one thing — collect them all.
    // The priority fact is derived directly from the answer array (state.js).
    id: 'qr1_priority', i18n: 'refine.q1', multi: true,
    options: [
      { id: 'views',       i18n: 'refine.q1.views' },
      { id: 'experiences', i18n: 'refine.q1.experiences' },
      { id: 'food',        i18n: 'refine.q1.food' },
      { id: 'romance',     i18n: 'refine.q1.romance' },
    ],
  },
  {
    id: 'qr2_pace', i18n: 'refine.q2',
    options: [
      { id: 'relaxed',  i18n: 'refine.q2.relaxed',  effects: { set: { pace: 'relaxed' } } },
      { id: 'balanced', i18n: 'refine.q2.balanced', effects: { set: { pace: 'balanced' } } },
      { id: 'intense',  i18n: 'refine.q2.intense',  effects: { set: { pace: 'intense' } } },
    ],
  },
];

// Steps that count toward the progress bar (info slides & landing excluded from the
// count but still shown). Conditional questions ARE counted — users who skip them
// simply see the bar leap forward, which reads as "shorter path", not a glitch.
export const PROGRESS_STEPS = QUIZ_STEPS.filter(function (s) {
  return s.type !== 'info';
}).map(function (s) { return s.id; });

export default QUIZ_STEPS;
