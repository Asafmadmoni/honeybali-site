/**
 * analytics.config.js — analytics wiring.
 * IDs are PLACEHOLDERS (env vars at deploy). The abstraction in quiz/assets/analytics.js
 * fans events out to whichever sinks have an ID. No PII (name/phone/email) is ever sent
 * as visible text to Pixel / GA.
 */

export const ANALYTICS_CONFIG = {
  // Fill via the team's tag manager. Empty string = sink disabled (no-op).
  gtmId: '',        // e.g. 'GTM-XXXXXXX'  -> pushes to window.dataLayer
  ga4Id: '',        // e.g. 'G-XXXXXXXXXX'
  metaPixelId: '',  // e.g. '000000000000000'
  // Meta CAPI is server-side; a static site cannot hold the access token.
  // Leave the endpoint blank until a backend/proxy exists.
  capiEndpoint: '',

  // Canonical event names emitted by the funnel.
  events: [
    'landing_view', 'quiz_start', 'quiz_question_view', 'quiz_answer_selected',
    'quiz_info_slide_view', 'quiz_back_click', 'quiz_abandon', 'quiz_complete',
    'quiz_loading_view', 'quiz_result_view', 'checkout_start', 'payment_success',
    'payment_failed', 'whatsapp_click', 'language_change',
  ],

  // Fields allowed on every event payload (NON-PII only).
  allowedFields: [
    'session_id', 'question_id', 'answer_id', 'question_index', 'language',
    'selected_package', 'duration', 'travelers_count', 'passport_type',
    'budget_segment', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
    'routing_reason', 'value', 'currency',
  ],

  // Never forward these to Pixel/GA as text.
  piiFields: ['fullName', 'phone', 'email', 'name'],
};

export default ANALYTICS_CONFIG;
