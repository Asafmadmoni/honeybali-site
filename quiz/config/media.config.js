/**
 * media.config.js — central media registry.
 * Until real assets are uploaded to /public/influencers/amna-amer/, these point to
 * clearly-labelled placeholders. Do NOT auto-pull from Instagram and do NOT ship
 * generic stock in the final version — replace each entry with real HoneyBali /
 * amna & amer content.
 */

const INFLUENCER_DIR = 'influencers/amna-amer'; // under /public, resolved relative to site base
const SITE_IMG = 'images'; // existing HoneyBali imagery already in the repo

// PLACEHOLDER=true means "not final media yet — show a labelled placeholder tile".
function ph(path, note) { return { src: path, placeholder: true, note: note }; }
function real(path) { return { src: path, placeholder: false }; }

export const MEDIA_CONFIG = {
  // Landing hero — vertical couple video/image from Bali.
  heroVideo: ph(`${INFLUENCER_DIR}/hero-vertical.mp4`, 'Amna & Amer vertical hero video'),
  heroImage: ph(`${INFLUENCER_DIR}/hero-vertical.jpg`, 'Amna & Amer vertical hero image'),
  coupleImage: ph(`${INFLUENCER_DIR}/couple.jpg`, 'Amna & Amer couple photo'),

  // Product-tier galleries.
  premiumHotelImages: [ph(`${INFLUENCER_DIR}/private-hotel-1.jpg`, 'Private tier hotel 1')],
  signatureHotelImages: [ph(`${INFLUENCER_DIR}/signature-hotel-1.jpg`, 'Signature tier hotel 1')],
  activitiesImages: [ph(`${INFLUENCER_DIR}/activity-1.jpg`, 'Bali activity 1')],
  restaurantImages: [ph(`${INFLUENCER_DIR}/restaurant-1.jpg`, 'Bali restaurant 1')],

  // Social proof — only use if real material exists.
  testimonialVideo: ph(`${INFLUENCER_DIR}/testimonial.mp4`, 'Real testimonial video (optional)'),
  testimonialImages: [ph(`${INFLUENCER_DIR}/testimonial-1.jpg`, 'Real testimonial image (optional)')],

  // Loading-screen imagery (reuses existing site media as a safe non-stock fallback).
  loadingImages: [
    real(`${SITE_IMG}/destinations/Ubud.jpg`),
    real(`${SITE_IMG}/destinations/NusaPenida.jpg`),
    real(`${SITE_IMG}/services/honeymoon.jpg`),
  ],
};

export default MEDIA_CONFIG;
