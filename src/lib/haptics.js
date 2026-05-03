import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback utility — works on both iOS and Android.
 * Gracefully no-ops on web or if haptics unavailable.
 */

/** Light tap — for toggles, switches, small selections */
export const hapticLight = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch { }
};

/** Medium tap — for button presses, tab switches */
export const hapticMedium = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch { }
};

/** Heavy tap — for important actions like scan, delete */
export const hapticHeavy = () => {
    try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch { }
};

/** Success — for successful sign-in, scan complete, save */
export const hapticSuccess = () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch { }
};

/** Warning — for caution alerts, validation errors */
export const hapticWarning = () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch { }
};

/** Error — for sign-in failure, scan error */
export const hapticError = () => {
    try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch { }
};

/** Selection tick — for scrolling through picker, list items */
export const hapticSelection = () => {
    try {
        Haptics.selectionAsync();
    } catch { }
};
