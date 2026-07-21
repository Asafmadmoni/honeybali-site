/**
 * campaign.config.js — influencer campaign, WhatsApp, UTM defaults.
 * All campaign wiring lives here so links/numbers can change without touching code.
 */

export const CAMPAIGN_CONFIG = {
  // Business WhatsApp number in international format, digits only (no + / spaces).
  whatsappNumber: '972542600047',

  // Lead-delivery webhook (Make.com/Zapier): every successful payment POSTs the full
  // lead + answers + order here so the business gets the details automatically —
  // without relying on the customer pressing the WhatsApp button.
  // ⚠️ Empty = disabled. Paste your Make webhook URL to activate.
  // HoneyBali leads dashboard — neutral VPS hostname, no brand crossover.
  // Token is a shared-secret deterrent — public by nature in client JS.
  leadWebhookUrl: 'https://srv1684269.hstgr.cloud/api/hb-lead',
  leadToken: 'hb_a0dc57947dccb3bc4162bfa946b300556af497c2',

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
