/**
 * media.config.js — central media registry.
 *
 * Each slot: { src, placeholder, fallback, note }
 *   src       — the FINAL asset under /public/influencers/amna-amer/ or /images/
 *   placeholder=true — final asset not uploaded yet (real fallback shown meanwhile)
 *
 * 2026-07-21: real Amna & Amer imagery pulled from her Instagram feed (@amnajbrn)
 * at Asaf's explicit direction — reel covers + photo posts, full resolution:
 *   hero-vertical.jpg  Banyumala waterfall (Amna, vertical 1216×2160)
 *   couple.jpg / couple-avatar.jpg  the two of them, luxury-resort backdrop (tight crop)
 *   beach-heart.jpg    black-sand beach drone, heart-shaped foam
 *   jungle-walk.jpg    misty garden walk toward the red temple
 *   koi-boat.jpg       yellow boat in the koi pond (red dress)
 *   rice-terraces.jpg  golden rice-terrace walk
 * No stock anywhere. Replace/extend by dropping files here and updating slots.
 */

const INF = 'public/influencers/amna-amer'; // site-relative
const IMG = 'images';                       // brand imagery from honeybali.com

function slot(src, fallback, note) {
  return { src: src, placeholder: true, fallback: fallback, note: note };
}
function real(src) { return { src: src, placeholder: false, fallback: null }; }

export const MEDIA_CONFIG = {
  // Landing hero — waterfall poster paints first, the brand film fades in over it.
  // cloud-free supercut of the brand film (4 scenes, bottom cloud band cropped,
  // crossfades; built with ffmpeg from the original). Self-hosted — no external CDN.
  heroVideo: real('public/media/hero-loop.mp4'),
  heroImage: real(`${INF}/hero-vertical.jpg`),
  coupleImage: real(`${INF}/couple.jpg`),
  coupleAvatar: real(`${INF}/couple-avatar.jpg`),

  // Interstitial visuals.
  premiumHotelImages: [slot(`${INF}/private-hotel-1.jpg`, `${IMG}/services/hotels.jpg`, 'Private tier hotel 1')],
  signatureHotelImages: [real(`${INF}/rice-terraces.jpg`)],
  activitiesImages: [real(`${INF}/jungle-walk.jpg`)],
  restaurantImages: [real(`${IMG}/destinations/Canggu.jpg`)],

  // Result-page hero backgrounds (per package).
  resultHero: {
    private: real(`${INF}/beach-heart.jpg`),
    signature: real(`${INF}/koi-boat.jpg`),
    visa: real(`${IMG}/brand/bg_hero.webp`),
  },

  // result-page gallery strips (influencer + brand photography, no repeats per page)
  resultGallery: {
    private: [real(`${INF}/rice-terraces.jpg`), real(`${IMG}/brand/the-edge.webp`)],
    signature: [real(`${INF}/jungle-walk.jpg`), real(`${IMG}/brand/changu-web.jpg`)],
    visa: [real(`${INF}/hero-vertical.jpg`), real(`${IMG}/brand/changu-web.jpg`)],
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
