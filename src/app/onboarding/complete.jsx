import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    ImageBackground,
    Pressable
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Lock,
    Check,
    Gift,
    ShieldCheck,
    Sparkles,
    X,
    Star,
    ArrowLeft,
    Unlock,
    Bell
} from 'lucide-react-native';
import { colors, fonts, spacing } from '@/constants/theme';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useAlert } from '@/contexts/AlertContext';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '@/lib/haptics';

const brandGreen = '#40D268';
const darkText = '#1A1D1C';
const grayText = '#8A9490';
const lightGreenBg = '#E6F8EA';

const FEATURES = [
    'Unlimited product scans',
    'Personalised safety scores',
    'AI Lumi Assistant',
    'Family profiles tracking'
];

export default function OnboardingComplete() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { offerings, isLoading, purchasePackage, isPro, loadOfferings } = useRevenueCat();

    const [purchasing, setPurchasing] = useState(false);
    const [retrying, setRetrying] = useState(false);

    // Animation values
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerTranslate = useRef(new Animated.Value(20)).current;
    
    const featuresOpacity = useRef(new Animated.Value(0)).current;
    const featuresTranslate = useRef(new Animated.Value(20)).current;
    
    const timelineOpacity = useRef(new Animated.Value(0)).current;
    const timelineTranslate = useRef(new Animated.Value(20)).current;
    
    const footerOpacity = useRef(new Animated.Value(0)).current;
    
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Staggered entrance animations
        Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(headerTranslate, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(featuresOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(featuresTranslate, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true })
            ]),
            Animated.parallel([
                Animated.timing(timelineOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.spring(timelineTranslate, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true })
            ]),
            Animated.timing(footerOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();

        // Continuous subtle floating background animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (isPro) {
            router.replace('/(tabs)');
        }
    }, [isPro]);

    if (isPro) return null;

    const targetPackage =
        offerings?.current?.availablePackages?.find(pkg => pkg.packageType === 'ANNUAL') ||
        offerings?.current?.availablePackages?.[0];

    const handleStartTrial = async () => {
        hapticMedium();

        if (!targetPackage) {
            if (loadOfferings) {
                setRetrying(true);
                await loadOfferings();
                setRetrying(false);
                const retryPkg =
                    offerings?.current?.availablePackages?.find(pkg => pkg.packageType === 'ANNUAL') ||
                    offerings?.current?.availablePackages?.[0];
                if (retryPkg) {
                    setPurchasing(true);
                    try {
                        const result = await purchasePackage(retryPkg);
                        if (result.success) {
                            hapticSuccess();
                            router.replace('/(tabs)');
                        }
                    } catch (e) {
                        if (!e.userCancelled) {
                            hapticError();
                            showAlert('Purchase Failed', e.message || 'Something went wrong.');
                        }
                    } finally {
                        setPurchasing(false);
                    }
                    return;
                }
            }
            showAlert('Unavailable', 'Products are being configured. Please try again shortly.');
            return;
        }

        setPurchasing(true);
        try {
            const result = await purchasePackage(targetPackage);
            if (result.success) {
                hapticSuccess();
                router.replace('/(tabs)');
            }
        } catch (e) {
            if (!e.userCancelled) {
                hapticError();
                showAlert('Purchase Failed', e.message || 'Something went wrong.');
            }
        } finally {
            setPurchasing(false);
        }
    };

    const handleSkip = () => {
        hapticLight();
        router.replace('/sign-in');
    };

    // Calculate background transform
    const floatTransform = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -20]
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            
            {/* Top background decoration */}
            <Animated.View 
                style={[
                    styles.topDecoration, 
                    { transform: [{ translateY: floatTransform }] }
                ]} 
            />

            <View style={[styles.content, { paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
                        <ArrowLeft size={24} color="#1a1a1a" />
                    </Pressable>
                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={handleSkip}
                        activeOpacity={0.7}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                    >
                        <X size={20} color={grayText} />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainContent}>
                    {/* Header Section */}
                    <Animated.View 
                        style={{ 
                            opacity: headerOpacity, 
                            transform: [{ translateY: headerTranslate }],
                            alignItems: 'center'
                        }}
                    >
                        <View style={styles.badgeContainer}>
                            <View style={styles.freeBadge}>
                                <Gift size={14} color={brandGreen} />
                                <Text style={styles.freeBadgeText}>7-DAY FREE TRIAL</Text>
                            </View>
                        </View>

                        <Text style={styles.headline}>
                            Try GoodFor Pro{'\n'}
                            <Text style={{ color: brandGreen }}>free for 7 days</Text>
                        </Text>
                        
                        <Text style={styles.subHeadline}>
                            Scan smarter, protect your family.{'\n'}We'll remind you 3 days before trial ends.
                        </Text>
                    </Animated.View>

                    {/* Pro Features Card */}
                    <Animated.View 
                        style={[
                            styles.featuresCard,
                            { 
                                opacity: featuresOpacity, 
                                transform: [{ translateY: featuresTranslate }] 
                            }
                        ]}
                    >
                        <View style={styles.featuresHeader}>
                            <Sparkles size={16} color={brandGreen} />
                            <Text style={styles.featuresTitle}>Everything included in Pro</Text>
                        </View>
                        
                        <View style={styles.featuresList}>
                            {FEATURES.map((feature, i) => (
                                <View key={i} style={styles.featureRow}>
                                    <View style={styles.checkCircle}>
                                        <Check size={12} color="#fff" strokeWidth={3} />
                                    </View>
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Timeline */}
                    <Animated.View 
                        style={[
                            styles.timelineBox,
                            { 
                                opacity: timelineOpacity, 
                                transform: [{ translateY: timelineTranslate }] 
                            }
                        ]}
                    >
                        <View style={styles.timelineItem}>
                            <Unlock size={22} color={brandGreen} fill={lightGreenBg} />
                            <View>
                                <Text style={styles.timelineTitle}>Today</Text>
                                <Text style={styles.timelineDesc}>Unlock all features</Text>
                            </View>
                        </View>
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineItem}>
                            <Bell size={22} color="#F59E0B" fill="#FEF3C7" />
                            <View>
                                <Text style={styles.timelineTitle}>Day 4</Text>
                                <Text style={styles.timelineDesc}>Get a reminder</Text>
                            </View>
                        </View>
                        <View style={styles.timelineLine} />
                        <View style={styles.timelineItem}>
                            <Star size={22} color="#3B82F6" fill="#DBEAFE" />
                            <View>
                                <Text style={styles.timelineTitle}>Day 7</Text>
                                <Text style={styles.timelineDesc}>£39.99/yr</Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Footer fixed to bottom */}
                <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
                    <Text style={styles.legalText}>
                        Cancel anytime in settings before trial ends.
                    </Text>
                    
                    <TouchableOpacity
                        style={[styles.trialBtn, (purchasing || retrying) && { opacity: 0.7 }]}
                        onPress={handleStartTrial}
                        disabled={purchasing || isLoading || retrying}
                        activeOpacity={0.9}
                    >
                        {purchasing || retrying ? (
                            <Text style={styles.trialBtnText}>Setting up...</Text>
                        ) : (
                            <Text style={styles.trialBtnText}>Start Free 7-Day Trial</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.secureRow}>
                        <ShieldCheck size={14} color={grayText} />
                        <Text style={styles.secureText}>No charge today · Secured by App Store</Text>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#FFFFFF',
    },
    topDecoration: {
        position: 'absolute',
        top: -200,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: lightGreenBg,
        opacity: 0.7,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        zIndex: 10,
    },
    skipBtn: {
        width: 32, 
        height: 32, 
        borderRadius: 16,
        backgroundColor: '#F0F2F1',
        alignItems: 'center', 
        justifyContent: 'center',
    },
    mainContent: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    badgeContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    freeBadge: {
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6,
        backgroundColor: lightGreenBg, 
        paddingHorizontal: 14, 
        paddingVertical: 6,
        borderRadius: 20,
    },
    freeBadgeText: { 
        fontSize: 11, 
        fontFamily: fonts.sansExtraBold, 
        color: brandGreen, 
        letterSpacing: 1 
    },
    headline: {
        fontSize: 38, 
        fontFamily: fonts.headingExtraBold, 
        color: darkText,
        textAlign: 'center', 
        lineHeight: 44, 
        letterSpacing: -1, 
        marginBottom: 12,
    },
    subHeadline: {
        fontSize: 15, 
        fontFamily: fonts.sansMedium, 
        color: grayText,
        textAlign: 'center', 
        lineHeight: 22,
        marginBottom: 32,
    },
    
    // FEATURES
    featuresCard: {
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 24,
        borderWidth: 1, 
        borderColor: '#E5E9E7', 
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    featuresHeader: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 8, 
        marginBottom: 20,
    },
    featuresTitle: { 
        fontSize: 15, 
        fontFamily: fonts.sansBold, 
        color: darkText 
    },
    featuresList: {
        gap: 14,
    },
    featureRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12,
    },
    checkCircle: {
        width: 22, 
        height: 22, 
        borderRadius: 11,
        backgroundColor: brandGreen, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
    featureText: { 
        fontSize: 15, 
        fontFamily: fonts.sansMedium, 
        color: darkText 
    },

    // TIMELINE COMPACT
    timelineBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        backgroundColor: '#FAFCFA',
        borderWidth: 1,
        borderColor: lightGreenBg,
        borderRadius: 20,
        padding: 20,
    },
    timelineItem: {
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    timelineDot: {
        fontSize: 18,
    },
    timelineTitle: {
        fontSize: 13,
        fontFamily: fonts.sansBold,
        color: darkText,
        textAlign: 'center',
    },
    timelineDesc: {
        fontSize: 11,
        fontFamily: fonts.sansMedium,
        color: grayText,
        textAlign: 'center',
        marginTop: 2,
    },
    timelineLine: {
        height: 1,
        backgroundColor: '#E5E9E7',
        width: 30,
        marginTop: 12,
    },

    // FOOTER
    footer: {
        paddingTop: 16,
    },
    legalText: {
        fontSize: 12, 
        fontFamily: fonts.sansMedium, 
        color: grayText,
        textAlign: 'center', 
        marginBottom: 16,
    },
    trialBtn: {
        backgroundColor: brandGreen, 
        paddingVertical: 20, 
        borderRadius: 32,
        alignItems: 'center', 
        justifyContent: 'center',
        shadowColor: brandGreen, 
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, 
        shadowRadius: 16, 
        elevation: 8,
    },
    trialBtnText: { 
        fontSize: 18, 
        fontFamily: fonts.headingExtraBold, 
        color: '#fff' 
    },
    secureRow: {
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'center', 
        gap: 6, 
        marginTop: 16,
    },
    secureText: { 
        fontSize: 12, 
        fontFamily: fonts.sansMedium, 
        color: grayText 
    },
});
