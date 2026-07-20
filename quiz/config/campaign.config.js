/**
 * campaign.config.js — influencer campaign, WhatsApp, UTM defaults.
 * All campaign wiring lives here so links/numbers can change without touching code.
 */

export const CAMPAIGN_CONFIG = {
  // Business WhatsApp number in international format, digits only (no + / spaces).
  // PLACEHOLDER — replace with the real HoneyBali business number.
  whatsappNumber: '972526642842', // from existing site footer (+972-52-664-2842)

  influencers: {
    key: 'amna_amer',
    profiles: {
      amna: 'https://www.instagram.com/amnajbrn',
      amer: 'https://www.instagram.com/msarwe.amer',
    },
  },

  // Default UTM values applied when the visitor arrives without them.
  utmDefaults: {
    utm_source: 'instagram',
    utm_medium: 'influencer',
    utm_campaign: 'amna_amer_bali',
  },

  // utm_content is used to attribute the lead to amna vs amer.
  contentAttribution: ['amna', 'amer'],
};

export default CAMPAIGN_CONFIG;
