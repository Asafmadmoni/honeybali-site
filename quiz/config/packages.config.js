/**
 * packages.config.js — the 3 (and only 3) products the funnel can route to.
 * Copy lives in locale files under `packages.<id>.*`; this file holds structure only.
 */

export const PACKAGES = {
  private: {
    id: 'private',
    name: 'HoneyBali Private',
    tier: 'premium',
    route: 'result/private',
    accent: 'private', // maps to a CSS theme block
    durations: [10, 14, 21],
    // i18n keys resolved at render time (arrays of bullet keys):
    i18n: {
      title: 'packages.private.title',
      tagline: 'packages.private.tagline',
      summaryLead: 'packages.private.summaryLead',
      includesKeys: [
        'packages.private.includes.hotels',
        'packages.private.includes.concierge',
        'packages.private.includes.privacy',
        'packages.private.includes.planning',
        'packages.private.includes.experiences',
        'packages.private.includes.service',
      ],
      differentiatorsKeys: [
        'packages.private.diff.topHotels',
        'packages.private.diff.privateExperiences',
        'packages.private.diff.minimalEffort',
      ],
      faqKeys: ['packages.private.faq.1', 'packages.private.faq.2', 'packages.private.faq.3'],
    },
    media: 'premiumHotelImages',
    pricingKind: 'retail', // uses RETAIL[PRIVATE_RETAIL_PRICE_<d>_DAYS]
  },

  signature: {
    id: 'signature',
    name: 'HoneyBali Signature',
    tier: 'value',
    route: 'result/signature',
    accent: 'signature',
    durations: [10, 14, 21],
    i18n: {
      title: 'packages.signature.title',
      tagline: 'packages.signature.tagline',
      summaryLead: 'packages.signature.summaryLead',
      includesKeys: [
        'packages.signature.includes.hotels',
        'packages.signature.includes.planning',
        'packages.signature.includes.visas',
        'packages.signature.includes.drivers',
        'packages.signature.includes.activities',
        'packages.signature.includes.dining',
      ],
      differentiatorsKeys: [
        'packages.signature.diff.value',
        'packages.signature.diff.smartHotels',
        'packages.signature.diff.fullPlanning',
      ],
      faqKeys: ['packages.signature.faq.1', 'packages.signature.faq.2', 'packages.signature.faq.3'],
    },
    media: 'signatureHotelImages',
    pricingKind: 'retail', // uses RETAIL[SIGNATURE_RETAIL_PRICE_<d>_DAYS]
  },

  visa: {
    id: 'visa',
    name: 'HoneyBali Visa',
    tier: 'service',
    route: 'result/visa',
    accent: 'visa',
    durations: null,
    i18n: {
      title: 'packages.visa.title',
      tagline: 'packages.visa.tagline',
      summaryLead: 'packages.visa.summaryLead',
      includesKeys: [
        'packages.visa.includes.handling',
        'packages.visa.includes.documents',
        'packages.visa.includes.perApplicant',
        'packages.visa.includes.eligibility',
        'packages.visa.includes.passportNote',
      ],
      differentiatorsKeys: ['packages.visa.diff.simple', 'packages.visa.diff.fast'],
      faqKeys: ['packages.visa.faq.1', 'packages.visa.faq.2'],
    },
    media: null,
    pricingKind: 'visa', // dynamic by applicants, VISA.priceFor()
  },
};

export const PACKAGE_IDS = ['private', 'signature', 'visa'];

export default PACKAGES;
