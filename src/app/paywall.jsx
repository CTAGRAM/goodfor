import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Animated,
    Dimensions,
    Platform,
    Image
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
    X,
    ArrowLeft,
    Lock,
    CheckCircle2,
    Sparkles,
    Star,
    ChevronDown,
    Check,
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useRevenueCat } from "@/contexts/RevenueCatContext";
import { useAlert } from "@/contexts/AlertContext";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "@/lib/haptics";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// specific colors from the reference image
const brandGreen = '#40D268';
const darkText = '#1A1D1C';
const grayText = '#8A9490';
const lightGreenBg = '#E6F8EA';

export default function Paywall() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showAlert } = useAlert();
    const { offerings, isLoading, purchasePackage, isPro, loadOfferings } = useRevenueCat();

    const [selectedPlan, setSelectedPlan] = useState('annual');
    const [purchasing, setPurchasing] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [showExitOffer, setShowExitOffer] = useState(false);
    const [exitCountdown, setExitCountdown] = useState(300);
    const [showMorePlans, setShowMorePlans] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const heroLottieRef = useRef(null);
    const exitLottieRef = useRef(null);

    const PRICES = {
        annual: { display: '£39.99', perMonth: '£3.33', period: 'year', packageType: 'ANNUAL', savings: '33%' },
        monthly: { display: '£4.99', perMonth: '£4.99', period: 'month', packageType: 'MONTHLY', savings: null },
    };

    const priceInfo = PRICES[selectedPlan];

    useEffect(() => {
        setTimeout(() => heroLottieRef.current?.play(), 100);
    }, []);

    // Handle already subscribed users
    useEffect(() => {
        if (isPro) {
            showAlert("Already Subscribed", "You already have GoodFor Pro!", [{ text: "OK", onPress: () => router.back() }]);
        }
    }, [isPro]);

    // Retry loading offerings
    useEffect(() => {
        if (!isLoading && !offerings?.current && loadOfferings) {
            const retryOfferings = async () => {
                setRetrying(true);
                await loadOfferings();
                setRetrying(false);
            };
            retryOfferings();
        }
    }, [isLoading, offerings]);

    if (isPro) return null;

    const targetPackage = offerings?.current?.availablePackages?.find(pkg => pkg.packageType === priceInfo.packageType) 
        || offerings?.current?.availablePackages?.find(pkg => pkg.packageType === 'ANNUAL') 
        || offerings?.current?.availablePackages?.[0];

    const handlePurchase = async () => {
        hapticMedium();
        if (!targetPackage) {
            if (loadOfferings) {
                setRetrying(true);
                await loadOfferings();
                setRetrying(false);
                const retryPkg = offerings?.current?.availablePackages?.find(pkg => pkg.packageType === "ANNUAL") || offerings?.current?.availablePackages?.[0];
                if (retryPkg) {
                    setPurchasing(true);
                    try {
                        const result = await purchasePackage(retryPkg);
                        if (result.success) {
                            hapticSuccess();
                            showAlert("Welcome to PRO!", "Enjoy unlimited scans and all premium features!", [{ text: "Get Started", onPress: () => router.replace('/(tabs)') }]);
                        }
                    } catch (e) {
                        if (!e.userCancelled) { hapticError(); showAlert("Purchase Failed", e.message || "Something went wrong."); }
                    } finally { setPurchasing(false); }
                    return;
                }
            }
            showAlert("Unavailable", "Products are being configured. Please try again.");
            return;
        }

        setPurchasing(true);
        try {
            const result = await purchasePackage(targetPackage);
            if (result.success) {
                hapticSuccess();
                showAlert("Welcome to PRO!", "Enjoy unlimited scans and all premium features!", [{ text: "Get Started", onPress: () => router.replace('/(tabs)') }]);
            }
        } catch (e) {
            if (!e.userCancelled) { hapticError(); showAlert("Purchase Failed", e.message || "Something went wrong."); }
        } finally { setPurchasing(false); }
    };

    const handleBack = async () => {
        if (!showExitOffer && !isPro) {
            setShowExitOffer(true);
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 180 }]} showsVerticalScrollIndicator={false} bounces={false}>
                
                {/* ─── GREEN HERO & CLOUD ─── */}
                <View style={[styles.heroBg, { paddingTop: insets.top + 20 }]}>
                    {/* Back Button */}
                    <View style={[styles.closeBtnShadow, { top: insets.top > 0 ? insets.top + 10 : 30 }]}>
                        <TouchableOpacity 
                            style={styles.closeBtn} 
                            onPress={() => { hapticLight(); handleBack(); }}
                            activeOpacity={0.7}
                        >
                            <BlurView intensity={80} tint="extraLight" style={styles.blurContainer}>
                                <ArrowLeft size={24} color="#1A1D1C" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    {/* Mascot */}
                    <View style={styles.mascotContainer}>
                        <LottieView
                            ref={heroLottieRef}
                            source={require('../assets/animations/upgrade.json')}
                            loop
                            style={styles.heroLottie}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Cloud SVG Separator */}
                    <View style={styles.cloudSeparator}>
                        <Svg height="60" width={SCREEN_WIDTH} viewBox="0 0 1440 320" preserveAspectRatio="none">
                            <Path 
                                fill="#ffffff" 
                                d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,160C960,128,1056,96,1152,106.7C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                            />
                        </Svg>
                    </View>
                </View>

                {/* ─── WHITE CONTENT AREA ─── */}
                <View style={styles.whiteContent}>
                    
                    {/* Badge & Title */}
                    <View style={styles.titleSection}>
                        <View style={styles.brandBadgeRow}>
                            <Text style={styles.brandName}>GoodFor</Text>
                            <View style={styles.proBadge}>
                                <Text style={styles.proBadgeText}>PRO</Text>
                            </View>
                        </View>
                        <Text style={styles.mainHeadline}>
                            Achieve your{'\n'}goals <Text style={{ color: brandGreen }}>4.2x</Text> faster
                        </Text>
                    </View>

                    {/* Plans */}
                    <View style={styles.plansSection}>
                        <TouchableOpacity 
                            style={[styles.annualCard, selectedPlan === 'annual' && styles.annualCardActive]} 
                            onPress={() => setSelectedPlan('annual')}
                            activeOpacity={0.9}
                        >
                            <View style={styles.mostPopularBadge}>
                                <Text style={styles.mostPopularText}>Most popular</Text>
                            </View>
                            <View style={styles.planRow}>
                                <View>
                                    <Text style={styles.planName}>Annual</Text>
                                    <Text style={styles.planSubPrice}>
                                        <Text style={{ textDecorationLine: 'line-through', color: '#B0B8B4' }}>£59.88</Text> → £39.99/yr
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.planLargePrice}>£3.33</Text>
                                    <Text style={styles.planPerMonth}>per month</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.showMorePlansBtn} onPress={() => setShowMorePlans(!showMorePlans)}>
                            <Text style={styles.showMorePlansText}>Show more plans</Text>
                            <ChevronDown size={16} color={grayText} style={{ transform: [{ rotate: showMorePlans ? '180deg' : '0deg' }], marginLeft: 4 }} />
                        </TouchableOpacity>

                        {showMorePlans && (
                            <TouchableOpacity 
                                style={[styles.monthlyCard, selectedPlan === 'monthly' && styles.monthlyCardActive]}
                                onPress={() => setSelectedPlan('monthly')}
                                activeOpacity={0.9}
                            >
                                <View style={styles.planRow}>
                                    <View>
                                        <Text style={styles.planName}>Monthly</Text>
                                        <Text style={styles.planSubPrice}>Cancel anytime</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.planLargePrice}>£4.99</Text>
                                        <Text style={styles.planPerMonth}>per month</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* What you get Table */}
                    <View style={styles.tableSection}>
                        {/* Table Headers */}
                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.tableTitle}>What you get</Text>
                            <View style={styles.tableColumnsHeaders}>
                                <Text style={styles.tableColFree}>Free</Text>
                                <View style={styles.tableColProBadge}>
                                    <Text style={styles.tableColProText}>PRO</Text>
                                </View>
                            </View>
                        </View>

                        {/* Pro background strip */}
                        <View style={styles.proStripBackground}>
                            {/* Decorative sparkles */}
                            <Sparkles size={16} color="rgba(64, 210, 104, 0.3)" style={{ position: 'absolute', top: 30, right: 10 }} />
                            <Sparkles size={12} color="rgba(64, 210, 104, 0.3)" style={{ position: 'absolute', bottom: 40, left: 10 }} />
                            <Sparkles size={20} color="rgba(64, 210, 104, 0.3)" style={{ position: 'absolute', top: 120, left: -5 }} />
                        </View>

                        {/* Table Rows */}
                        {[
                            { label: "Basic ingredient scans", free: true, pro: true },
                            { label: "Personalised safety scores", free: false, pro: true },
                            { label: "AI Lumi Assistant", free: false, pro: true },
                            { label: "Healthier alternatives", free: false, pro: true },
                            { label: "Family profiles tracking", free: false, pro: true },
                            { label: "Smart shopping basket", free: false, pro: true },
                        ].map((row, idx) => (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.tableRowLabel}>{row.label}</Text>
                                <View style={styles.tableColumns}>
                                    <View style={styles.tableIconCell}>
                                        {row.free ? (
                                            <View style={styles.greenCheckCircle}><Check size={10} color="#fff" strokeWidth={3} /></View>
                                        ) : (
                                            <Lock size={16} color="#D1D5D3" />
                                        )}
                                    </View>
                                    <View style={[styles.tableIconCell, { zIndex: 10 }]}>
                                        <View style={styles.greenCheckCircle}><Check size={10} color="#fff" strokeWidth={3} /></View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Success Stories */}
                    <View style={styles.successSection}>
                        <Text style={styles.successTitle}>Success stories{'\n'}from our clients</Text>
                        
                        <View style={styles.testimonialCard}>
                            <View style={styles.testimonialHeader}>
                                <View style={styles.testimonialAvatarPlaceholder}>
                                    <Text style={{color: '#fff', fontFamily: fonts.sansBold}}>S</Text>
                                </View>
                                <View style={styles.testimonialInfo}>
                                    <Text style={styles.testimonialName}>Sarah 🇬🇧</Text>
                                    <Text style={styles.testimonialSub}>Mum of 3, using since Jan 2026</Text>
                                </View>
                            </View>
                            <Text style={styles.testimonialQuote}>
                                "I usually quit apps after a week, but this one stuck. The mascot, the design, and how quick it is to scan. Obsessed. It's so much easier to shop now!"
                            </Text>
                        </View>
                        
                        <View style={styles.pagingDots}>
                            <View style={styles.dotActive} />
                            <View style={styles.dotInactive} />
                            <View style={styles.dotInactive} />
                        </View>

                        <View style={styles.wreathRow}>
                            <View style={styles.wreathItem}>
                                <View style={[styles.wreathContent, { paddingBottom: 4 }]}>
                                    <Text style={styles.wreathNumber}>4.8</Text>
                                    <Text style={styles.wreathLabel}>average</Text>
                                </View>
                            </View>
                            <View style={styles.wreathItem}>
                                <View style={[styles.wreathContent, { paddingBottom: 4 }]}>
                                    <Text style={styles.wreathNumber}>10K+</Text>
                                    <Text style={styles.wreathLabel}>families</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* ─── LEGAL LINKS (At bottom of ScrollView) ─── */}
                    <View style={{ marginTop: 40, paddingHorizontal: 24 }}>
                        <Text style={styles.footerLegalText}>
                            Your yearly or monthly subscription automatically renews for the same term unless cancelled at least 24 hours prior to the end of the current term. Cancel any time in the App Store at no additional cost; your subscription will then cease at the end of the current term.
                        </Text>
                        
                        <View style={styles.footerLinksRow}>
                            <TouchableOpacity><Text style={styles.footerLink}>Restore purchases</Text></TouchableOpacity>
                            <TouchableOpacity><Text style={styles.footerLink}>Terms of Use</Text></TouchableOpacity>
                            <TouchableOpacity><Text style={styles.footerLink}>Privacy Notice</Text></TouchableOpacity>
                        </View>
                    </View>

                </View>
            </ScrollView>

            {/* ─── STICKY FOOTER ─── */}
            <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 10 }]}>
                <TouchableOpacity 
                    style={[styles.continueBtn, (purchasing || retrying) && { opacity: 0.7 }]}
                    onPress={handlePurchase}
                    disabled={purchasing || isLoading || retrying}
                    activeOpacity={0.9}
                >
                    {(purchasing || retrying) ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.continueBtnText}>Continue</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.secureRow}>
                    <Lock size={12} color={grayText} />
                    <Text style={styles.secureText}>Secured with App Store & Google Play. Easy to cancel.</Text>
                </View>
            </View>
            {/* EXIT INTENT MODAL */}
            <Modal visible={showExitOffer} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontFamily: fonts.headingExtraBold, color: darkText, marginBottom: 8, textAlign: 'center' }}>Wait! Don't leave yet</Text>
                        <Text style={{ fontSize: 14, fontFamily: fonts.sans, color: grayText, textAlign: 'center', marginBottom: 20 }}>
                            Get unlimited access to GoodFor Pro. Protect your family and make healthier choices today.
                        </Text>
                        
                        <TouchableOpacity 
                            style={{ width: '100%', backgroundColor: brandGreen, paddingVertical: 14, borderRadius: 32, alignItems: 'center', marginBottom: 12 }}
                            onPress={() => {
                                setShowExitOffer(false);
                                handlePurchase();
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 16, fontFamily: fonts.sansBold }}>Claim Special Offer</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={{ width: '100%', paddingVertical: 14, alignItems: 'center' }}
                            onPress={() => {
                                setShowExitOffer(false);
                                router.back();
                            }}
                        >
                            <Text style={{ color: grayText, fontSize: 14, fontFamily: fonts.sansBold }}>No thanks, I'll pass</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ═══════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollView: { flex: 1 },
    
    // HERO
    heroBg: { backgroundColor: brandGreen, position: 'relative', height: 260 },
    closeBtnShadow: {
        position: 'absolute', left: 20, zIndex: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
    },
    closeBtn: { 
        width: 40, height: 40, borderRadius: 20, 
        overflow: 'hidden', 
    },
    blurContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center', 
        backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)'
    },
    mascotContainer: { position: 'absolute', bottom: 10, alignSelf: 'center', zIndex: 10 },
    heroLottie: { width: 180, height: 180 },
    cloudSeparator: { position: 'absolute', bottom: -1, width: '100%', height: 60, zIndex: 5 },
    
    // CONTENT
    whiteContent: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 10 },
    
    titleSection: { alignItems: 'center', marginBottom: 24 },
    brandBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    brandName: { fontSize: 20, fontFamily: fonts.headingExtraBold, color: darkText },
    proBadge: { backgroundColor: brandGreen, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    proBadgeText: { color: '#fff', fontSize: 11, fontFamily: fonts.sansBold },
    mainHeadline: { fontSize: 36, fontFamily: fonts.headingExtraBold, color: darkText, textAlign: 'center', lineHeight: 40, letterSpacing: -1 },

    // PLANS
    plansSection: { marginBottom: 32 },
    annualCard: { borderRadius: 32, borderWidth: 2, borderColor: '#E5E9E7', padding: 20, paddingTop: 28, position: 'relative', marginBottom: 12 },
    annualCardActive: { borderColor: brandGreen, backgroundColor: '#FAFDFA' },
    mostPopularBadge: { position: 'absolute', top: 16, left: 20, backgroundColor: brandGreen, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    mostPopularText: { color: '#fff', fontSize: 10, fontFamily: fonts.sansBold, textTransform: 'uppercase', letterSpacing: 0.5 },
    planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 },
    planName: { fontSize: 22, fontFamily: fonts.headingExtraBold, color: darkText, marginBottom: 4 },
    planSubPrice: { fontSize: 12, fontFamily: fonts.sansMedium, color: grayText },
    planLargePrice: { fontSize: 24, fontFamily: fonts.headingExtraBold, color: darkText },
    planPerMonth: { fontSize: 11, fontFamily: fonts.sans, color: grayText, marginTop: 4 },
    
    showMorePlansBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
    showMorePlansText: { fontSize: 13, fontFamily: fonts.sansMedium, color: grayText },
    
    monthlyCard: { borderRadius: 32, borderWidth: 2, borderColor: '#E5E9E7', padding: 20, marginTop: 8 },
    monthlyCardActive: { borderColor: brandGreen, backgroundColor: '#FAFDFA' },

    // WHAT YOU GET
    tableSection: { position: 'relative', marginBottom: 40, marginTop: 10 },
    tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, marginBottom: 8 },
    tableTitle: { fontSize: 20, fontFamily: fonts.headingExtraBold, color: darkText },
    tableColumnsHeaders: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingRight: 10 },
    tableColFree: { fontSize: 12, fontFamily: fonts.sansMedium, color: grayText, width: 40, textAlign: 'center' },
    tableColProBadge: { backgroundColor: brandGreen, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, width: 44, alignItems: 'center' },
    tableColProText: { color: '#fff', fontSize: 10, fontFamily: fonts.sansBold },
    
    proStripBackground: { position: 'absolute', top: 35, right: 0, width: 64, bottom: -20, backgroundColor: lightGreenBg, borderRadius: 32, zIndex: 1 },
    
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
    tableRowLabel: { fontSize: 13, fontFamily: fonts.sansBold, color: darkText, flex: 1 },
    tableColumns: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingRight: 10 },
    tableIconCell: { width: 40, alignItems: 'center', justifyContent: 'center' },
    greenCheckCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: brandGreen, alignItems: 'center', justifyContent: 'center' },

    // SUCCESS STORIES
    successSection: { marginBottom: 20 },
    successTitle: { fontSize: 32, fontFamily: fonts.headingExtraBold, color: darkText, textAlign: 'center', lineHeight: 36, marginBottom: 24, letterSpacing: -1 },
    testimonialCard: { borderRadius: 24, borderWidth: 1, borderColor: '#E5E9E7', padding: 20, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    testimonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    testimonialAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#A0AAB2', alignItems: 'center', justifyContent: 'center' },
    testimonialInfo: { flex: 1 },
    testimonialName: { fontSize: 15, fontFamily: fonts.sansBold, color: darkText },
    testimonialSub: { fontSize: 12, fontFamily: fonts.sans, color: grayText, marginTop: 2 },
    testimonialQuote: { fontSize: 14, fontFamily: fonts.sansBold, color: darkText, lineHeight: 22 },
    
    pagingDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 32 },
    dotActive: { width: 6, height: 6, borderRadius: 3, backgroundColor: darkText },
    dotInactive: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D1D5D3' },

    wreathRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 10 },
    wreathItem: { alignItems: 'center' },
    wreathContent: { alignItems: 'center' },
    wreathNumber: { fontSize: 36, fontFamily: fonts.headingExtraBold, color: darkText, letterSpacing: -1 },
    wreathLabel: { fontSize: 11, fontFamily: fonts.sansBold, color: darkText, textAlign: 'center', marginTop: 4 },

    // FOOTER & LEGAL
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 24, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F2F1' },
    footerLegalText: { fontSize: 9, fontFamily: fonts.sans, color: '#A0AAB2', textAlign: 'center', lineHeight: 14, marginBottom: 16 },
    footerLinksRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 40 },
    footerLink: { fontSize: 12, fontFamily: fonts.sansBold, color: darkText },
    
    continueBtn: { backgroundColor: '#1A1D1C', paddingVertical: 18, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    continueBtnText: { fontSize: 18, fontFamily: fonts.sansBold, color: '#fff' },
    
    secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
    secureText: { fontSize: 10, fontFamily: fonts.sansMedium, color: grayText }
});
