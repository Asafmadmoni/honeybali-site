/**
 * media.config.js — central media registry.
 *
 * Each slot: { src, placeholder, fallback, note }
 *   src       — the FINAL asset (Amna & Amer / HoneyBali content) under /public/influencers/amna-amer/
 *   placeholder=true — final asset not uploaded yet
 *   fallback  — real imagery already in the repo, shown meanwhile so the funnel always
 *               looks premium (never a striped dev box). Replace by dropping the real
 *               file at `src` and flipping placeholder to false.
 *
 * Do NOT auto-pull from Instagram. Do NOT ship generic stock in the final version.
 */

const INF = 'influencers/amna-amer'; // under /public (site-relative)
const IMG = 'images';                // existing site imagery in the repo

function slot(src, fallback, note) {
  return { src: src, placeholder: true, fallback: fallback, note: note };
}
function real(src) { return { src: src, placeholder: false, fallback: null }; }

export const MEDIA_CONFIG = {
  // Landing hero — vertical couple video/image from Bali.
  // No fallback video on purpose: the interim star is the vibrant Nusa Penida shot.
  // When the real Amna & Amer vertical video lands at `src`, it will fade in over the poster.
  heroVideo: slot(`${INF}/hero-vertical.mp4`,
    'https://honeybali.com/wp-content/uploads/2024/12/HoneyBali-compress-1-1.mp4',
    'Amna & Amer vertical hero video'),
  heroImage: slot(`${INF}/hero-vertical.jpg`, `${IMG}/brand/the-edge.webp`, 'Amna & Amer vertical hero image'),
  coupleImage: slot(`${INF}/couple.jpg`, `${IMG}/brand/couple2.jpeg`, 'Amna & Amer couple photo'),

  // Product-tier galleries.
  premiumHotelImages: [slot(`${INF}/private-hotel-1.jpg`, `${IMG}/services/hotels.jpg`, 'Private tier hotel 1')],
  signatureHotelImages: [slot(`${INF}/signature-hotel-1.jpg`, `${IMG}/destinations/Sideman.jpg`, 'Signature tier hotel 1')],
  activitiesImages: [slot(`${INF}/activity-1.jpg`, `${IMG}/brand/kecak.png`, 'Bali activity 1')],
  restaurantImages: [slot(`${INF}/restaurant-1.jpg`, `${IMG}/destinations/Canggu.jpg`, 'Bali restaurant 1')],

  // Result-page hero backgrounds (per package).
  resultHero: {
    private: slot(`${INF}/private-hero.jpg`, `${IMG}/brand/the-edge.webp`, 'Private result hero'),
    signature: slot(`${INF}/signature-hero.jpg`, `${IMG}/brand/changu-web.jpg`, 'Signature result hero'),
    visa: slot(`${INF}/visa-hero.jpg`, `${IMG}/brand/bg_hero.webp`, 'Visa result hero'),
  },

  // result-page gallery strips (brand's own photography)
  resultGallery: {
    private: [real(`${IMG}/brand/changu-web.jpg`), real(`${IMG}/brand/bg_hero.webp`)],
    signature: [real(`${IMG}/brand/the-edge.webp`), real(`${IMG}/brand/bg_hero.webp`)],
    visa: [real(`${IMG}/brand/the-edge.webp`), real(`${IMG}/brand/changu-web.jpg`)],
  },

  // Social proof — only if REAL material exists.
  testimonialVideo: slot(`${INF}/testimonial.mp4`, null, 'Real testimonial video (optional)'),
  testimonialImages: [slot(`${INF}/testimonial-1.jpg`, null, 'Real testimonial image (optional)')],

  // Loading-screen imagery.
  loadingImages: [
    real(`${IMG}/destinations/Ubud.jpg`),
    real(`${IMG}/destinations/NusaPenida.jpg`),
    real(`${IMG}/services/honeymoon.jpg`),
  ],
};

export default MEDIA_CONFIG;
