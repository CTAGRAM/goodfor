import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';

const AlertContext = createContext(null);

/**
 * Custom cross-platform alert that looks premium on both iOS and Android.
 * Drop-in replacement for Alert.alert() — same API signature.
 * 
 * Usage:
 *   const { showAlert } = useAlert();
 *   showAlert('Title', 'Message', [{ text: 'OK', onPress: () => {} }]);
 */
export const AlertProvider = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ title: '', message: '', buttons: [] });
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const showAlert = useCallback((title, message = '', buttons = [{ text: 'OK' }]) => {
        // Normalize buttons to always have at least an OK button
        const normalizedButtons = buttons.length === 0 ? [{ text: 'OK' }] : buttons;
        setAlertConfig({ title, message, buttons: normalizedButtons });
        setVisible(true);

        // Animate in
        scaleAnim.setValue(0.85);
        opacityAnim.setValue(0);
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 65,
                friction: 8,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const dismissAlert = useCallback((onPress) => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0.85,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
            if (onPress) onPress();
        });
    }, []);

    const value = { showAlert };

    return (
        <AlertContext.Provider value={value}>
            {children}

            <Modal
                visible={visible}
                transparent
                animationType="none"
                statusBarTranslucent
                onRequestClose={() => dismissAlert()}
            >
                <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                    <TouchableOpacity
                        style={styles.overlayTouch}
                        activeOpacity={1}
                        onPress={() => dismissAlert()}
                    />

                    <Animated.View style={[
                        styles.alertCard,
                        { transform: [{ scale: scaleAnim }] }
                    ]}>
                        {/* Title */}
                        {alertConfig.title ? (
                            <Text style={styles.title}>{alertConfig.title}</Text>
                        ) : null}

                        {/* Message */}
                        {alertConfig.message ? (
                            <Text style={styles.message}>{alertConfig.message}</Text>
                        ) : null}

                        {/* Buttons */}
                        <View style={[
                            styles.buttonContainer,
                            alertConfig.buttons.length === 2 && styles.buttonContainerRow,
                        ]}>
                            {alertConfig.buttons.map((button, index) => {
                                const isDestructive = button.style === 'destructive';
                                const isCancel = button.style === 'cancel';
                                const isPrimary = !isDestructive && !isCancel &&
                                    (alertConfig.buttons.length === 1 || index === alertConfig.buttons.length - 1);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.button,
                                            isPrimary && styles.buttonPrimary,
                                            isDestructive && styles.buttonDestructive,
                                            isCancel && styles.buttonCancel,
                                            alertConfig.buttons.length === 2 && styles.buttonHalf,
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => dismissAlert(button.onPress)}
                                    >
                                        <Text style={[
                                            styles.buttonText,
                                            isPrimary && styles.buttonTextPrimary,
                                            isDestructive && styles.buttonTextDestructive,
                                            isCancel && styles.buttonTextCancel,
                                        ]}>
                                            {button.text}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        // Fallback to native Alert if context is not available
        return {
            showAlert: (title, message, buttons) => {
                const { Alert } = require('react-native');
                Alert.alert(title, message, buttons);
            }
        };
    }
    return context;
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    overlayTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    alertCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        width: '100%',
        maxWidth: 320,
        paddingTop: spacing[6],
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[5],
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    title: {
        fontSize: 18,
        fontFamily: fonts.heading,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[2],
        lineHeight: 24,
    },
    message: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: spacing[5],
    },
    buttonContainer: {
        gap: spacing[2],
    },
    buttonContainerRow: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    button: {
        paddingVertical: spacing[3] + 2,
        paddingHorizontal: spacing[5],
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.secondary,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonDestructive: {
        backgroundColor: `${colors.destructive}15`,
    },
    buttonCancel: {
        backgroundColor: colors.secondary,
    },
    buttonHalf: {
        flex: 1,
    },
    buttonText: {
        fontSize: 15,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
    },
    buttonTextPrimary: {
        color: colors.primaryForeground,
    },
    buttonTextDestructive: {
        color: colors.destructive,
    },
    buttonTextCancel: {
        color: colors.mutedForeground,
    },
});
