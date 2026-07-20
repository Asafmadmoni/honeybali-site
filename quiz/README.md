# HoneyBali Quiz Funnel — Amna & Amer campaign

Mobile-first quiz funnel (he/ar, RTL) routing hot Instagram traffic to one of three
products: **HoneyBali Private**, **HoneyBali Signature**, **HoneyBali Visa**.

## Links

- General (Hebrew): `/quiz/`
- Influencers (Arabic): `/quiz/?lang=ar&utm_source=instagram&utm_medium=influencer&utm_campaign=amna_amer_bali`
- Per-influencer: append `&utm_content=amna` or `&utm_content=amer`

Flow: Landing → 12-step quiz (2 info slides) → loading (3 stages) → personalized result
(one product only) → checkout → success → WhatsApp (opens ONLY after payment).

## Architecture

Static ES-module SPA — matches the existing stack (static site, no build, GitHub Pages).

```
quiz/
  index.html            app shell (noindex)
  locales/he.json, ar.json     ALL copy — full key parity (193 = 193)
  config/               EVERYTHING editable lives here, never in components
    app.config.js       env detection, langs, session TTL, storage keys
    campaign.config.js  WhatsApp number, influencer profiles, UTM defaults
    media.config.js     media registry → /public/influencers/amna-amer/
    pricing.config.js   RETAIL placeholders (null), VISA $1200/applicant, budget ranges
    packages.config.js  3 products: structure + i18n key maps
    quiz.config.js      12 steps + 2 info slides; options carry routing `effects`
    routing.config.js   priority rules, Private gate, reasonCodes
    analytics.config.js event names, allowed fields, PII blocklist, IDs (empty)
  assets/
    app.js              router + all views (landing/quiz/loading/result/checkout/success)
    state.js            durable state: session, UTM, answers (localStorage, 24h TTL)
    i18n.js             translation engine, RTL, lang persistence
    routing.js          pure decide(answers) → {package, reasonCodes}
    analytics.js        façade → GTM/GA4/Pixel; dedupes; strips PII
    payment.js          provider abstraction; 'simulated' adapter (dev only)
    funnel.css          design tokens mirrored from the main site
404.html                SPA deep-route fallback (GitHub Pages)
```

## Routing rules

1. `visaExplicit` flag (q5/q7 "only need a visa") → **Visa** (`VISA_ONLY_EXPLICIT`).
2. Already planned + hotels booked + not asking full service → **Visa** (`VISA_ONLY_ALREADY_PLANNED`).
3. **Private** needs style/lodging match AND budget match AND score ≥5 lead
   (`PRIVATE_LUXURY_MATCH`, `PRIVATE_BUDGET_MATCH`).
4. Everyone else wanting planning → **Signature** (`SIGNATURE_VALUE_MATCH`).
Deep-linked results get reason `DEEP_LINK`.

## Pricing & security

- **Internal costs are NOT in the codebase at all** (no backend → per brief, omitted
  entirely; handoff note in git-ignored `INTERNAL-COSTS.md`). Verified: none of the six
  cost figures appear anywhere under `quiz/`.
- Retail prices: `RETAIL.PRIVATE_RETAIL_PRICE_{10,14,21}_DAYS`, `SIGNATURE_…` — all
  `null`. While null: dev shows "PRICE PENDING: <KEY>", production shows a
  personal-offer CTA. **No invented prices, ever.**
- Visa: $1,200 × applicants, computed from config (never from URL/query).
- Payment: `simulated` adapter only; clearly flagged in dev, blocked from posing as a
  live charge in production. Real adapter goes in `payment.js` + env keys at deploy.

## Placeholders to replace before launch

| What | Where |
|---|---|
| Retail prices (6 keys) | `pricing.config.js` → `RETAIL` |
| Budget-range bands | `pricing.config.js` → `BUDGET_RANGES` + q9 copy |
| Hero video/photos of Amna & Amer | `/public/influencers/amna-amer/` (see its README) |
| GTM / GA4 / Pixel IDs | `analytics.config.js` |
| Payment provider adapter + keys | `assets/payment.js` + env vars |
| WhatsApp business number (verify) | `campaign.config.js` |
| Flip env to production | `app.config.js` → `detectEnv()` return |
| CRM lead sink (none exists yet) | wire in `app.js` lead submit + payment success |

## Analytics events

landing_view, quiz_start, quiz_question_view, quiz_answer_selected,
quiz_info_slide_view, quiz_back_click, quiz_abandon, quiz_complete, quiz_loading_view,
quiz_result_view, checkout_start, payment_success, payment_failed, whatsapp_click,
language_change. Payloads carry session/UTM/package/duration/passport/budget/reason —
PII (name/phone/email) is stripped before any sink.

## Run & test

Local: `npx http-server . -p 8663` → `http://localhost:8663/quiz/`.
Dev mode is auto-on for localhost/Pages (shows DEV badges, sim-payment buttons,
missing-key markers `⟨key⟩`). Force with `?env=development|production`.

## Deploy

`git push origin main` → GitHub Pages redeploys (~1 min). Note: the main clone homepage
is password-gated; `/quiz/` is intentionally NOT gated (campaign traffic) but is
noindex + robots-blocked.
