/**
 * PostHog Analytics Integration
 * 
 * Uses pure JS posthog-react-native library for Expo Go compatibility.
 * Provides helper functions for tracking core app events.
 */

import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export const posthog = new PostHog(POSTHOG_API_KEY || 'phc_placeholder', {
  host: POSTHOG_HOST,
  enable: !!POSTHOG_API_KEY, // Disable if no key is provided
  flushAt: 1, // Flush events aggressively for testing
});

/**
 * Identify a user in PostHog
 */
export const identifyUser = (userId, properties = {}) => {
  if (!POSTHOG_API_KEY) return;
  posthog.identify(userId, properties);
};

/**
 * Reset PostHog user (on logout)
 */
export const resetAnalyticsUser = () => {
  if (!POSTHOG_API_KEY) return;
  posthog.reset();
};

/**
 * Core tracking helpers
 */

export const trackProductScan = (barcode, productType, status) => {
  if (!POSTHOG_API_KEY) return;
  posthog.capture('scan_product', {
    barcode,
    productType, // 'FOOD' or 'BEAUTY'
    status, // e.g. 'SUCCESS', 'NOT_FOUND'
  });
};

export const trackBasketScore = (totalScore, safetyLevel) => {
  if (!POSTHOG_API_KEY) return;
  posthog.capture('basket_analyzed', {
    totalScore,
    safetyLevel,
  });
};

export const trackReviewProfileSwap = (fromProfileType, toProfileType) => {
  if (!POSTHOG_API_KEY) return;
  posthog.capture('swapped_profile_view', {
    fromProfileType,
    toProfileType,
  });
};

// Start tracking session if API Key exists
if (POSTHOG_API_KEY) {
  console.log('[PostHog] Initialized analytics routing to:', POSTHOG_HOST);
} else {
  console.log('[PostHog] Disabled (No EXPO_PUBLIC_POSTHOG_API_KEY found)');
}
