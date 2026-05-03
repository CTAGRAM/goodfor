/**
 * Notification Service
 * 
 * Handles push notifications for product recall alerts.
 * Uses expo-notifications for local + push notifications.
 * SAFE: Detects Expo Go via Constants and skips module loading entirely.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { getNewRecalls, getRecallSeverity } from './recallService';
import Constants from 'expo-constants';

let Notifications = null;
const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
    try {
        Notifications = require('expo-notifications');
    } catch (e) {
        console.warn('[Notifications] expo-notifications not available:', e.message);
    }
} else {
    console.log('[Notifications] Expo Go detected — push notifications disabled.');
}

// ─── Config ──────────────────────────────────────────────────────
const PREFS_KEY = 'notification_prefs';

const DEFAULT_PREFS = {
    enabled: true,
    recallAlerts: true,
    severityFilter: 'all', // 'all', 'dangerous', 'moderate'
    checkIntervalMs: 4 * 60 * 60 * 1000, // 4 hours
};

// ─── Setup ───────────────────────────────────────────────────────
/**
 * Configure notification handler (call once in app root)
 */
export const setupNotifications = () => {
    if (!Notifications) return null;

    // How to present notifications when app is in foreground
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });

    // Handle notification taps (deep link to alerts)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'alerts') {
            router.push('/alerts');
        } else if (data?.recallId) {
            router.push('/alerts');
        }
    });

    return subscription;
};

// ─── Permission ──────────────────────────────────────────────────
/**
 * Request notification permissions
 * @returns {boolean} Whether permission was granted
 */
export const requestNotificationPermission = async () => {
    if (!Notifications) return false;

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return false;
        }

        // Android needs a notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('recall-alerts', {
                name: 'Product Recall Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#E63E11',
                sound: 'default',
            });
        }

        console.log('[Notifications] Permission granted');
        return true;
    } catch (error) {
        console.error('[Notifications] Error requesting permission:', error);
        return false;
    }
};

// ─── Preferences ─────────────────────────────────────────────────
export const getNotificationPrefs = async () => {
    try {
        const stored = await AsyncStorage.getItem(PREFS_KEY);
        if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    } catch (e) { /* ignore */ }
    return DEFAULT_PREFS;
};

export const setNotificationPrefs = async (prefs) => {
    try {
        const current = await getNotificationPrefs();
        const updated = { ...current, ...prefs };
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('[Notifications] Error saving prefs:', e);
    }
};

// ─── Send Local Notification ─────────────────────────────────────
/**
 * Send a local notification for a recall alert
 */
export const sendRecallNotification = async (recall) => {
    if (!Notifications) return;

    try {
        const severity = getRecallSeverity(recall.severity || recall.classification);
        const emoji = severity.level === 'dangerous' ? '🚨' : severity.level === 'moderate' ? '⚠️' : 'ℹ️';

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `${emoji} Product Recall — ${severity.label}`,
                body: truncate(recall.reason || recall.product || 'New product recall alert', 120),
                data: {
                    screen: 'alerts',
                    recallId: recall.id,
                    source: recall.source,
                },
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'recall-alerts' }),
            },
            trigger: null, // Immediately
        });

        console.log(`[Notifications] Sent recall notification: ${recall.id}`);
    } catch (error) {
        console.error('[Notifications] Error sending notification:', error);
    }
};

// ─── Recall Check ────────────────────────────────────────────────
/**
 * Check for new recalls and send notifications
 * Call this periodically (e.g., on app open, or from background task)
 */
export const checkAndNotifyNewRecalls = async () => {
    if (!Notifications) return;

    try {
        const prefs = await getNotificationPrefs();
        if (!prefs.enabled || !prefs.recallAlerts) {
            console.log('[Notifications] Recall alerts disabled');
            return;
        }

        // Check permission
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        const newRecalls = await getNewRecalls();
        if (newRecalls.length === 0) {
            console.log('[Notifications] No new recalls');
            return;
        }

        // Filter by severity preference
        let filtered = newRecalls;
        if (prefs.severityFilter === 'dangerous') {
            filtered = newRecalls.filter(r => r.severity === 'dangerous');
        } else if (prefs.severityFilter === 'moderate') {
            filtered = newRecalls.filter(r => r.severity === 'dangerous' || r.severity === 'moderate');
        }

        // Send notifications (max 5 to avoid spam)
        const toNotify = filtered.slice(0, 5);
        for (const recall of toNotify) {
            await sendRecallNotification(recall);
        }

        // If more than 5, send summary
        if (filtered.length > 5) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🔔 ${filtered.length} New Product Recalls`,
                    body: `${filtered.length} new recalls detected in your region. Tap to view all.`,
                    data: { screen: 'alerts' },
                    sound: 'default',
                    ...(Platform.OS === 'android' && { channelId: 'recall-alerts' }),
                },
                trigger: null,
            });
        }

        // Update badge count
        await Notifications.setBadgeCountAsync(filtered.length);

        console.log(`[Notifications] Sent ${Math.min(toNotify.length, 5)} recall notifications`);
    } catch (error) {
        console.error('[Notifications] Error in checkAndNotify:', error);
    }
};

// ─── Badge Management ────────────────────────────────────────────
export const clearNotificationBadge = async () => {
    if (!Notifications) return;
    try {
        await Notifications.setBadgeCountAsync(0);
    } catch (e) { /* ignore */ }
};

export const dismissAllNotifications = async () => {
    if (!Notifications) return;
    try {
        await Notifications.dismissAllNotificationsAsync();
        await clearNotificationBadge();
    } catch (e) { /* ignore */ }
};

// ─── Shopping Basket Reminders ───────────────────────────────────
/**
 * Schedule a weekly shopping reminder notification
 */
export const scheduleShoppingReminder = async () => {
    if (!Notifications) return;

    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        // Cancel existing shopping reminders first
        await cancelShoppingReminders();

        // Android channel for basket
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('basket-reminders', {
                name: 'Shopping Reminders',
                importance: Notifications.AndroidImportance.DEFAULT,
                sound: 'default',
            });
        }

        // Weekly reminder — Saturday morning
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🛒 Ready for your weekly shop?',
                body: 'Build today\'s basket with Lumi and track your score!',
                data: { screen: 'basket' },
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'basket-reminders' }),
            },
            trigger: {
                weekday: 7, // Saturday
                hour: 9,
                minute: 0,
                repeats: true,
                type: 'calendar',
                channelId: 'basket-reminders',
            },
        });

        // Mid-week gentle nudge — Wednesday
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '💡 Quick health check',
                body: 'Scan a product and see how it scores!',
                data: { screen: 'scan' },
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'basket-reminders' }),
            },
            trigger: {
                weekday: 4, // Wednesday
                hour: 12,
                minute: 0,
                repeats: true,
                type: 'calendar',
                channelId: 'basket-reminders',
            },
        });

        console.log('[Notifications] Shopping reminders scheduled');
    } catch (error) {
        console.error('[Notifications] Error scheduling shopping reminders:', error);
    }
};

/**
 * Cancel all shopping reminders
 */
export const cancelShoppingReminders = async () => {
    if (!Notifications) return;

    try {
        const all = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of all) {
            const screen = notif.content?.data?.screen;
            if (screen === 'basket' || screen === 'scan') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    } catch (e) {
        console.error('[Notifications] Error cancelling shopping reminders:', e);
    }
};

/**
 * Send a streak-at-risk reminder notification
 */
export const sendStreakReminder = async (currentStreak) => {
    if (!Notifications) return;

    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔥 Don\'t lose your streak!',
                body: `You're one basket away from keeping your ${currentStreak}-week streak alive!`,
                data: { screen: 'basket' },
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'basket-reminders' }),
            },
            trigger: null,
        });
    } catch (error) {
        console.error('[Notifications] Error sending streak reminder:', error);
    }
};

/**
 * Send an improvement praise notification
 */
export const sendImprovementPraise = async (improvement) => {
    if (!Notifications) return;

    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') return;

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🌟 Nice work!',
                body: `Your basket score improved by ${improvement} points this week!`,
                data: { screen: 'basket-history' },
                sound: 'default',
                ...(Platform.OS === 'android' && { channelId: 'basket-reminders' }),
            },
            trigger: null,
        });
    } catch (error) {
        console.error('[Notifications] Error sending improvement praise:', error);
    }
};

// ─── Helpers ─────────────────────────────────────────────────────
const truncate = (str, maxLen) => {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
};
