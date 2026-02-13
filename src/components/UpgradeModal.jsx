import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from "react-native";
import { useEffect, useRef } from "react";
import {
    Crown,
    X,
    QrCode,
    Brain,
    ShieldCheck,
    UserPlus,
    ArrowRight,
    Zap
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRouter } from "expo-router";

/**
 * UpgradeModal - Prompts users to upgrade to Pro
 * 
 * Usage:
 * <UpgradeModal 
 *   visible={showUpgrade} 
 *   onClose={() => setShowUpgrade(false)}
 *   trigger="scanLimit" // or "feature", "soft"
 *   currentCount={10}
 *   maxCount={10}
 * />
 */
export default function UpgradeModal({
    visible,
    onClose,
    trigger = 'scanLimit', // 'scanLimit' | 'feature' | 'soft'
    featureName = 'AI Insights',
    currentCount = 0,
    maxCount = 10
}) {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.9);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const handleUpgrade = () => {
        onClose();
        router.push('/paywall');
    };

    const getContent = () => {
        switch (trigger) {
            case 'scanLimit':
                return {
                    icon: QrCode,
                    title: "You've reached your scan limit",
                    subtitle: `${currentCount}/${maxCount} free scans used this month`,
                    description: "Upgrade to Pro for unlimited product scans and detailed AI insights.",
                    ctaText: "Upgrade to Pro",
                    showSkip: false,
                };
            case 'feature':
                return {
                    icon: Zap,
                    title: "Premium Feature",
                    subtitle: featureName,
                    description: `${featureName} is a Pro feature. Upgrade to unlock personalized insights and advanced analysis.`,
                    ctaText: "Unlock Pro Features",
                    showSkip: true,
                };
            case 'soft':
                return {
                    icon: Crown,
                    title: "You're doing great!",
                    subtitle: `${currentCount} scans completed`,
                    description: "Love GoodFor? Upgrade to Pro for unlimited scans, AI insights, and family profiles.",
                    ctaText: "Try Pro",
                    showSkip: true,
                };
            default:
                return {
                    icon: Crown,
                    title: "Upgrade to Pro",
                    subtitle: "Unlock premium features",
                    description: "Get unlimited scans, AI insights, and more.",
                    ctaText: "Upgrade Now",
                    showSkip: true,
                };
        }
    };

    const content = getContent();
    const Icon = content.icon;

    const benefits = [
        { icon: QrCode, text: "Unlimited scans" },
        { icon: Brain, text: "AI-powered insights" },
        { icon: ShieldCheck, text: "Advanced safety alerts" },
        { icon: UserPlus, text: "5 family profiles" },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity
                    style={styles.overlayTouch}
                    activeOpacity={1}
                    onPress={content.showSkip ? onClose : undefined}
                />

                <Animated.View style={[
                    styles.modal,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    {/* Close button */}
                    {content.showSkip && (
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <X size={20} color={colors.mutedForeground} />
                        </TouchableOpacity>
                    )}

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconBg}>
                            <Icon size={32} color={colors.primary} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{content.title}</Text>
                    <Text style={styles.subtitle}>{content.subtitle}</Text>
                    <Text style={styles.description}>{content.description}</Text>

                    {/* Benefits */}
                    <View style={styles.benefitsGrid}>
                        {benefits.map((benefit, index) => {
                            const BenefitIcon = benefit.icon;
                            return (
                                <View key={index} style={styles.benefitItem}>
                                    <BenefitIcon size={16} color={colors.primary} />
                                    <Text style={styles.benefitText}>{benefit.text}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* CTA Button */}
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={handleUpgrade}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.ctaButtonText}>{content.ctaText}</Text>
                        <ArrowRight size={18} color={colors.primaryForeground} />
                    </TouchableOpacity>

                    {/* Skip Button */}
                    {content.showSkip && (
                        <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                            <Text style={styles.skipButtonText}>Maybe later</Text>
                        </TouchableOpacity>
                    )}

                    {/* No skip message for hard limit */}
                    {!content.showSkip && (
                        <Text style={styles.limitMessage}>
                            Your free scans reset on the 1st of each month
                        </Text>
                    )}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[5],
    },
    overlayTouch: {
        ...StyleSheet.absoluteFillObject,
    },
    modal: {
        backgroundColor: colors.background,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: spacing[4],
        right: spacing[4],
        padding: spacing[1],
    },
    iconContainer: {
        marginBottom: spacing[4],
    },
    iconBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontFamily: fonts.heading.bold,
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: spacing[1],
    },
    subtitle: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: spacing[2],
    },
    description: {
        fontSize: 14,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing[5],
    },
    benefitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing[2],
        marginBottom: spacing[5],
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${colors.accent}60`,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: radius.full,
        gap: spacing[1],
    },
    benefitText: {
        fontSize: 12,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },
    ctaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[6],
        borderRadius: radius.full,
        width: '100%',
    },
    ctaButtonText: {
        fontSize: 16,
        fontFamily: fonts.sans.bold,
        color: colors.primaryForeground,
    },
    skipButton: {
        paddingVertical: spacing[3],
    },
    skipButtonText: {
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
    limitMessage: {
        fontSize: 11,
        fontFamily: fonts.sans.regular,
        color: `${colors.mutedForeground}80`,
        textAlign: 'center',
        marginTop: spacing[3],
    },
});
