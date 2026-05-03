import React from 'react';
import { Linking } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoodForWidget } from './GoodForWidget';

const WIDGET_DATA_KEY = '@goodfor_widget_data';

/**
 * Gets cached widget data from AsyncStorage.
 * The main app updates this data after each scan or basket completion.
 */
async function getWidgetData() {
    try {
        const cached = await AsyncStorage.getItem(WIDGET_DATA_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            // Calculate human-readable "last updated" string
            if (data.lastUpdated) {
                const updatedAt = new Date(data.lastUpdated);
                const now = new Date();
                const diffMs = now - updatedAt;
                const diffMin = Math.floor(diffMs / 60000);
                if (diffMin < 1) {
                    data.lastUpdatedLabel = 'Just now';
                } else if (diffMin < 60) {
                    data.lastUpdatedLabel = `${diffMin}m ago`;
                } else if (diffMin < 1440) {
                    data.lastUpdatedLabel = `${Math.floor(diffMin / 60)}h ago`;
                } else {
                    data.lastUpdatedLabel = `${Math.floor(diffMin / 1440)}d ago`;
                }
            }
            return data;
        }
    } catch (e) {
        console.error('[Widget] Failed to read widget data:', e);
    }
    return {
        safeCount: 0,
        reviewCount: 0,
        basketScore: 0,
        recentProducts: [],
        lastUpdatedLabel: null,
    };
}

async function widgetTaskHandler(props) {
    const widgetInfo = props.widgetInfo;
    const data = await getWidgetData();

    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED':
            props.renderWidget(
                <GoodForWidget
                    widgetInfo={widgetInfo}
                    safeCount={data.safeCount}
                    reviewCount={data.reviewCount}
                    basketScore={data.basketScore}
                    lastUpdated={data.lastUpdatedLabel}
                    recentProducts={data.recentProducts || []}
                />
            );
            break;

        case 'WIDGET_CLICK':
            // Handle click actions — open the app via deep-link
            if (props.clickAction === 'OPEN_SCANNER') {
                // Open scanner tab
                try {
                    await Linking.openURL('goodfor://scan');
                } catch (e) {
                    // Fallback: just open the app
                    try { await Linking.openURL('goodfor://'); } catch (_) {}
                }
            } else if (props.clickAction === 'OPEN_APP') {
                try {
                    const uri = props.clickActionData?.uri || 'goodfor://';
                    await Linking.openURL(uri);
                } catch (e) {
                    console.log('[Widget] Failed to open app:', e.message);
                }
            }

            // Re-render widget with fresh data after click
            const freshData = await getWidgetData();
            props.renderWidget(
                <GoodForWidget
                    widgetInfo={widgetInfo}
                    safeCount={freshData.safeCount}
                    reviewCount={freshData.reviewCount}
                    basketScore={freshData.basketScore}
                    lastUpdated={freshData.lastUpdatedLabel}
                    recentProducts={freshData.recentProducts || []}
                />
            );
            break;

        case 'WIDGET_DELETED':
            // Clean up if needed
            break;

        default:
            break;
    }
}

export { widgetTaskHandler, WIDGET_DATA_KEY };
registerWidgetTaskHandler(widgetTaskHandler);
