import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Leaf, ShieldCheck } from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { getProductByBarcode } from "@/lib/openFoodFacts";
import { analyzeProductSafety, yearsToMonths } from "@/lib/productSafety";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function ScanProcessing() {
    const { barcode } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, profile } = useAuth();
    const [status, setStatus] = useState('Checking ingredients...');

    // Animations
    const spinAnim = new Animated.Value(0);
    const pulseAnim = new Animated.Value(1);
    const bounce1 = new Animated.Value(0);
    const bounce2 = new Animated.Value(0);

    useEffect(() => {
        // Spin animation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            ])
        ).start();

        // Bounce animations
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounce1, { toValue: -8, duration: 500, useNativeDriver: true }),
                Animated.timing(bounce1, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(300),
                Animated.timing(bounce2, { toValue: -8, duration: 500, useNativeDriver: true }),
                Animated.timing(bounce2, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        ).start();

        // Process barcode
        processBarcode();
    }, [barcode]);

    const processBarcode = async () => {
        try {
            setStatus('Looking up product...');
            const product = await getProductByBarcode(barcode);

            if (!product) {
                router.replace({
                    pathname: '/scan-error',
                    params: { barcode, error: 'Product not found in database' },
                });
                return;
            }

            setStatus('Analysing safety...');
            const ageMonths = profile?.age_years ? yearsToMonths(profile.age_years) : 360;
            const safetyAnalysis = analyzeProductSafety(product, ageMonths);

            setStatus('Saving results...');
            await saveScanToHistory(product, safetyAnalysis);

            router.replace({
                pathname: '/product-summary',
                params: { productData: JSON.stringify({ ...product, safetyAnalysis }) },
            });
        } catch (error) {
            console.error('Scan error:', error);
            router.replace({
                pathname: '/scan-error',
                params: { barcode, error: error.message },
            });
        }
    };

    const saveScanToHistory = async (product, safetyAnalysis) => {
        // Use user.id (from auth) as fallback if profile.id is not available
        const userId = profile?.id || user?.id;
        if (!userId) {
            console.warn('[ScanSave] No user ID available, skipping save');
            return;
        }
        try {
            console.log('[ScanSave] Saving scan for user:', userId);
            const { error } = await supabase.from('scans').insert({
                user_id: userId,
                barcode: product.barcode,
                product_name: product.name,
                brand: product.brand,
                image_url: product.imageUrl,
                ingredients_text: product.ingredientsText,
                allergens_tags: product.allergens,
                nutriments: product.nutriments,
                category: product.categories?.[0] || 'Food Product',
                safety_level: safetyAnalysis.safety,
                safety_score: safetyAnalysis.safeScore,
                safety_flags: safetyAnalysis.issues.map(i => i.reason),
                safety_details: {
                    issues: safetyAnalysis.issues,
                    ageGroup: safetyAnalysis.ageGroup,
                },
                alternatives_data: null,
            });
            if (error) {
                console.error('[ScanSave] Insert error:', error);
            } else {
                console.log('[ScanSave] Scan saved successfully');
            }
        } catch (e) {
            console.error('[ScanSave] Exception:', e);
        }
    };

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurLeft} />
            <View style={styles.blurRight} />

            {/* Content */}
            <View style={styles.content}>
                {/* Animated icon */}
                <View style={styles.iconWrapper}>
                    <View style={styles.pulseRing} />
                    <Animated.View style={[styles.spinRing, { transform: [{ rotate: spin }] }]} />
                    <Animated.View style={[styles.iconBg, { transform: [{ scale: pulseAnim }] }]}>
                        <Leaf size={40} color={colors.chart1} />
                    </Animated.View>

                    {/* Floating dots */}
                    <Animated.View style={[styles.dot1, { transform: [{ translateY: bounce1 }] }]} />
                    <Animated.View style={[styles.dot2, { transform: [{ translateY: bounce2 }] }]} />
                </View>

                {/* Status text */}
                <Text style={styles.title}>{status}</Text>
                <Text style={styles.subtitle}>This usually takes a few seconds</Text>

                {/* Status badge */}
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ANALYSING PRODUCT</Text>
                    <View style={styles.statusDot} />
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 100 }]}>
                <View style={styles.footerContent}>
                    <ShieldCheck size={16} color={colors.mutedForeground} />
                    <Text style={styles.footerText}>VERIFYING AGAINST GLOBAL STANDARDS</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blurLeft: {
        position: 'absolute',
        top: '50%',
        left: -128,
        width: 256,
        height: 256,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 128,
        marginTop: -128,
    },
    blurRight: {
        position: 'absolute',
        bottom: -96,
        right: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 96,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[8],
    },
    iconWrapper: {
        position: 'relative',
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing[12],
    },
    pulseRing: {
        position: 'absolute',
        width: 128,
        height: 128,
        borderRadius: 64,
        borderWidth: 2,
        borderColor: `${colors.primary}10`,
    },
    spinRing: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: 'transparent',
        borderTopColor: `${colors.primary}40`,
        borderRightColor: `${colors.primary}40`,
    },
    iconBg: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.border}50`,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    dot1: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.accent,
    },
    dot2: {
        position: 'absolute',
        bottom: -4,
        left: -4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: `${colors.chart1}40`,
    },
    title: {
        fontSize: 24,
        fontFamily: fonts.heading.bold,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: spacing[3],
    },
    subtitle: {
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
        textAlign: 'center',
        marginBottom: spacing[16],
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
        paddingHorizontal: spacing[5],
        paddingVertical: spacing[2],
        backgroundColor: `${colors.accent}20`,
        borderWidth: 1,
        borderColor: `${colors.accent}30`,
        borderRadius: radius.full,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.chart1,
    },
    statusText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: `${colors.primary}70`,
        letterSpacing: 2,
    },
    footer: {
        alignItems: 'center',
        paddingTop: spacing[10],
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    footerText: {
        fontSize: 10,
        fontFamily: fonts.sans.bold,
        color: `${colors.mutedForeground}60`,
        letterSpacing: 2,
    },
});
