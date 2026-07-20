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
      { id: 'other',   i18n: 'quiz.q3.other',    effects: { set: { travelMonth: 'other' } } },
      { id: 'undecided', i18n: 'quiz.q3.undecided', effects: { set: { travelMonth: 'undecided' } } },
    ],
  },
  {
    // Conditional follow-up: only for date-undecided users. Turns "don't know" into a
    // usable signal + a micro-commitment instead of a dead end. "dreaming" marks explorers.
    id: 'q3b_window', type: 'single', i18n: 'quiz.q3b', microcopy: 'quiz.q3b.microcopy',
    showIf: { factIn: { travelMonth: ['undecided', 'other'] } },
    options: [
      { id: 'summer2027', i18n: 'quiz.q3b.summer',     effects: { set: { travelWindow: 'summer2027' } } },
      { id: 'winter',     i18n: 'quiz.q3b.winter',     effects: { set: { travelWindow: 'winter2027' } } },
      { id: 'withinYear', i18n: 'quiz.q3b.withinYear', effects: { set: { travelWindow: 'within_year' } } },
      { id: 'dreaming',   i18n: 'quiz.q3b.dreaming',   effects: { score: { explorer: 2 }, set: { travelWindow: 'dreaming' } } },
    ],
  },
  {
    id: 'q4_duration', type: 'single', i18n: 'quiz.q4',
    options: [
      { id: '10', i18n: 'quiz.q4.d10', effects: { set: { duration: 10 } } },
      { id: '14', i18n: 'quiz.q4.d14', effects: { set: { duration: 14 } } },
      { id: '21', i18n: 'quiz.q4.d21', effects: { set: { duration: 21 } } },
      { id: 'unsure', i18n: 'quiz.q4.unsure', effects: { score: { explorer: 1 }, set: { duration: null } } },
    ],
  },

  {
    id: 'info1', type: 'info', i18n: 'quiz.info1', media: 'coupleImage',
    // reacts to WHO is flying (q1)
    variants: [
      { when: { factIn: { partyType: ['couple'] } },  i18n: 'quiz.info1.couple',  media: 'coupleImage' },
      { when: { factIn: { partyType: ['family'] } },  i18n: 'quiz.info1.family',  media: 'signatureHotelImages' },
      { when: { factIn: { partyType: ['friends'] } }, i18n: 'quiz.info1.friends', media: 'restaurantImages' },
      { when: { factIn: { partyType: ['solo'] } },    i18n: 'quiz.info1.solo',    media: 'activitiesImages' },
    ],
  },

  {
    id: 'q5_style', type: 'single', i18n: 'quiz.q5',
    options: [
      { id: 'ultra',   i18n: 'quiz.q5.ultra',   effects: { score: { private: 3 }, set: { style: 'ultra' } } },
      { id: 'value',   i18n: 'quiz.q5.value',   effects: { score: { signature: 3 }, set: { style: 'value' } } },
      { id: 'nature',  i18n: 'quiz.q5.nature',  effects: { score: { signature: 2 }, set: { style: 'nature' } } },
      { id: 'visaonly', i18n: 'quiz.q5.visaOnly', effects: { score: { visa: 5 }, flag: 'visaExplicit', set: { style: 'visa' } } },
    ],
  },
  {
    id: 'q6_lodging', type: 'single', i18n: 'quiz.q6',
    options: [
      { id: 'best',   i18n: 'quiz.q6.best',   effects: { score: { private: 3 }, set: { lodging: 'best' } } },
      { id: 'luxury', i18n: 'quiz.q6.luxury', effects: { score: { private: 1, signature: 2 }, set: { lodging: 'luxury' } } },
      { id: 'quality', i18n: 'quiz.q6.quality', effects: { score: { signature: 3 }, set: { lodging: 'quality' } } },
      { id: 'booked', i18n: 'quiz.q6.booked', effects: { score: { visa: 2 }, flag: 'alreadyPlanned', set: { lodging: 'booked' } } },
    ],
  },
  {
    id: 'q7_handle', type: 'multi', i18n: 'quiz.q7',
    options: [
      { id: 'visas',      i18n: 'quiz.q7.visas',      effects: { score: { signature: 1 } } },
      { id: 'itinerary',  i18n: 'quiz.q7.itinerary',  effects: { score: { signature: 2, private: 1 } } },
      { id: 'hotels',     i18n: 'quiz.q7.hotels',     effects: { score: { signature: 1, private: 1 } } },
      { id: 'drivers',    i18n: 'quiz.q7.drivers',    effects: { score: { signature: 1 } } },
      { id: 'activities', i18n: 'quiz.q7.activities', effects: { score: { signature: 1 } } },
      { id: 'dining',     i18n: 'quiz.q7.dining',     effects: { score: { signature: 1 } } },
      { id: 'full',       i18n: 'quiz.q7.full',       effects: { score: { private: 3, signature: 2 }, set: { wantsFullService: true } } },
      { id: 'visaonly',   i18n: 'quiz.q7.visaOnly',   effects: { score: { visa: 5 }, flag: 'visaExplicit', exclusive: true } },
    ],
  },

  {
    id: 'info2', type: 'info', i18n: 'quiz.info2', media: 'signatureHotelImages',
    // irrelevant for visa-only users — they skip straight on (shorter, smarter path)
    showIf: { notFlag: 'visaExplicit' },
    // reacts to WHAT they asked for (q5 style / q7 full service)
    variants: [
      { when: { factIn: { wantsFullService: [true] } }, i18n: 'quiz.info2.full',  media: 'premiumHotelImages' },
      { when: { factIn: { style: ['ultra'] } },         i18n: 'quiz.info2.ultra', media: 'premiumHotelImages' },
      { when: { factIn: { style: ['value'] } },         i18n: 'quiz.info2.value' },
    ],
  },

  {
    id: 'q8_passport', type: 'single', i18n: 'quiz.q8', microcopy: 'quiz.q8.microcopy',
    options: [
      { id: 'il',      i18n: 'quiz.q8.il',      effects: { set: { passportType: 'israeli' } } },
      { id: 'mixed',   i18n: 'quiz.q8.mixed',   effects: { set: { passportType: 'mixed' } } },
      { id: 'foreign', i18n: 'quiz.q8.foreign', effects: { set: { passportType: 'foreign' } } },
      { id: 'unsure',  i18n: 'quiz.q8.unsure',  effects: { set: { passportType: 'unknown' } } },
    ],
  },

  // Objection-handling slide — right where the passport/timing objections are born.
  {
    id: 'info3', type: 'info', i18n: 'quiz.info3', media: 'activitiesImages',
    steps: ['quiz.info3.step1', 'quiz.info3.step2', 'quiz.info3.step3'],
    // reacts to WHICH passport they hold (q8)
    variants: [
      { when: { factIn: { passportType: ['foreign'] } }, i18n: 'quiz.info3.foreign' },
      { when: { factIn: { passportType: ['unknown'] } }, i18n: 'quiz.info3.unsure' },
    ],
  },
  {
    id: 'q9_budget', type: 'single', i18n: 'quiz.q9',
    // Options are conceptual until retail bands are set (BUDGET_RANGE_* placeholders).
    options: [
      { id: 'smart',    i18n: 'quiz.q9.smart',    effects: { score: { signature: 3 }, set: { budgetSegment: 'signature' } } },
      { id: 'indulgent', i18n: 'quiz.q9.indulgent', effects: { score: { private: 2, signature: 1 }, set: { budgetSegment: 'flexible' } } },
      { id: 'highest',  i18n: 'quiz.q9.highest',  effects: { score: { private: 3 }, set: { budgetSegment: 'private' } } },
      { id: 'undecided', i18n: 'quiz.q9.undecided', effects: { score: { explorer: 1 }, set: { budgetSegment: 'unknown' } } },
    ],
  },
  {
    id: 'q10_flights', type: 'single', i18n: 'quiz.q10',
    options: [
      { id: 'yes',     i18n: 'quiz.q10.yes',     effects: { set: { flightStatus: 'booked' } } },
      { id: 'notyet',  i18n: 'quiz.q10.notYet',  effects: { set: { flightStatus: 'not_yet' } } },
      { id: 'waiting', i18n: 'quiz.q10.waiting', effects: { set: { flightStatus: 'waiting_plan' } } },
      { id: 'checking', i18n: 'quiz.q10.checking', effects: { score: { explorer: 1 }, set: { flightStatus: 'checking' } } },
    ],
  },
  {
    id: 'q11_stage', type: 'single', i18n: 'quiz.q11',
    options: [
      { id: 'now',      i18n: 'quiz.q11.now',     effects: { score: { private: 1, signature: 1 }, set: { readiness: 'now' } } },
      { id: 'soon',     i18n: 'quiz.q11.soon',    effects: { set: { readiness: 'soon' } } },
      { id: 'comparing', i18n: 'quiz.q11.comparing', effects: { score: { explorer: 1 }, set: { readiness: 'comparing' } } },
      { id: 'future',   i18n: 'quiz.q11.future',  effects: { score: { explorer: 2 }, set: { readiness: 'future' } } },
    ],
  },
  {
    id: 'q12_lead', type: 'lead', i18n: 'quiz.q12',
    fields: [
      { id: 'fullName', i18n: 'quiz.q12.name',  type: 'text',  required: true },
      { id: 'phone',    i18n: 'quiz.q12.phone', type: 'tel',   required: true },
      { id: 'email',    i18n: 'quiz.q12.email', type: 'email', required: false },
    ],
    consent: { id: 'marketing', i18n: 'quiz.q12.consent', required: false, preChecked: false },
  },
];

// Steps that count toward the progress bar (info slides & landing excluded from the count
// but still shown). Questions + lead = the "answered" denominator.
export const PROGRESS_STEPS = QUIZ_STEPS.filter(function (s) {
  return s.type !== 'info' && !s.showIf; // conditional follow-ups don't inflate the count
}).map(function (s) { return s.id; });

export default QUIZ_STEPS;
