import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WIDGET_DATA_KEY = '@goodfor_widget_data';

/**
 * Updates the home screen widget with fresh data.
 * Should be called after:
 * - A new scan is completed
 * - Basket is finalized
 * - App is foregrounded
 * 
 * @param {Object} data
 * @param {number} data.safeCount - Number of safe products in recent scans
 * @param {number} data.reviewCount - Number of products flagged for review
 * @param {number} data.basketScore - Latest basket score (0-100)
 * @param {Array} [data.recentProducts] - Last 3 scanned products [{name, safety}]
 */
export async function updateWidgetData({ safeCount = 0, reviewCount = 0, basketScore = 0, recentProducts = [] }) {
    try {
        await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify({
            safeCount,
            reviewCount,
            basketScore,
            recentProducts: (recentProducts || []).slice(0, 3), // Keep last 3 for large widget
            lastUpdated: new Date().toISOString(),
        }));

        // Trigger widget refresh on Android
        if (Platform.OS === 'android') {
            try {
                const { requestWidgetUpdate } = require('react-native-android-widget');
                const { GoodForWidget } = require('./GoodForWidget');
                const React = require('react');

                // Calculate a human-readable label
                const lastUpdated = 'Just now';

                // Update all widget variants
                const widgetNames = ['GoodForWidget', 'GoodForWidgetSmall', 'GoodForWidgetLarge'];
                
                for (const widgetName of widgetNames) {
                    try {
                        await requestWidgetUpdate({
                            widgetName,
                            renderWidget: () => React.createElement(GoodForWidget, {
                                safeCount,
                                reviewCount,
                                basketScore,
                                lastUpdated,
                                recentProducts: (recentProducts || []).slice(0, 3),
                                widgetInfo: { width: widgetName === 'GoodForWidgetSmall' ? 200 : 400, height: widgetName === 'GoodForWidgetLarge' ? 400 : 200 },
                            }),
                        });
                    } catch (e) {
                        // Widget type might not be placed on home screen, skip silently
                    }
                }
                console.log('[Widget] Updated successfully');
            } catch (e) {
                // Widget package may not be available in Expo Go
                console.log('[Widget] Update skipped (not available):', e.message);
            }
        }
    } catch (e) {
        console.error('[Widget] Failed to save widget data:', e);
    }
}

/**
 * Extracts widget-relevant data from the home page scan stats.
 * Call this from the home page after loading scan data.
 */
export function extractWidgetData(scans) {
    let safeCount = 0;
    let reviewCount = 0;
    const recentProducts = [];

    (scans || []).forEach(scan => {
        if (scan.safety_level === 'safe') {
            safeCount++;
        } else {
            reviewCount++;
        }
        // Collect recent products for large widget
        if (recentProducts.length < 3) {
            recentProducts.push({
                name: scan.product_name || scan.products?.name || 'Unknown',
                safety: scan.safety_level || 'caution',
            });
        }
    });

    return { safeCount, reviewCount, recentProducts };
}
