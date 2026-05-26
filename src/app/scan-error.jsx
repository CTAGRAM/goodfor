import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, HelpCircle, Camera, Image as ImageIcon, Sparkles } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Button } from '@/components/ui';
import * as ImagePicker from 'expo-image-picker';
import { analyzeLabel } from '@/lib/geminiVision';
import { analyzeProductSafety, yearsToMonths } from '@/lib/productSafety';
import { useAuth } from '@/contexts/AuthContext';
import { hapticSuccess, hapticError } from '@/lib/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanningRings } from '@/components/AnimatedEffects';

export default function ScanError() {
    const router = useRouter();
    const { barcode } = useLocalSearchParams();
    const isDirectLabelScan = barcode === 'label-scan';
    const { profile, activeFamilyMember } = useAuth();
    const insets = useSafeAreaInsets();
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisStatus, setAnalysisStatus] = useState('');

    const processImage = async (source) => {
        try {
            let result;
            if (source === 'camera') {
                const { status } = await ImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Camera access is required to take a photo of the label.');
                    return;
                }
                result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                    base64: true,
                    allowsEditing: true,
                });
            } else {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Photo library access is required.');
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    quality: 0.8,
                    base64: true,
                    allowsEditing: true,
                });
            }

            if (result.canceled || !result.assets?.[0]?.base64) return;

            setAnalyzing(true);
            setAnalysisStatus('Reading label with AI...');

            const imageAsset = result.assets[0];
            const mimeType = imageAsset.mimeType || 'image/jpeg';

            // Step 1: Extract data from label using Gemini Vision
            const product = await analyzeLabel(imageAsset.base64, mimeType);
            setAnalysisStatus('Analysing safety...');

            // Step 2: Run through our safety engine
            const ageSource = activeFamilyMember || profile;
            const ageMonths = ageSource?.age_years
                ? yearsToMonths(ageSource.age_years)
                : 360;

            const userPreferences = {
                allergies: activeFamilyMember?.allergies || profile?.allergies || [],
                dietaryRestrictions: activeFamilyMember?.dietary_restrictions || profile?.dietary_preferences || [],
                healthConditions: activeFamilyMember?.health_conditions || profile?.health_conditions || [],
                isPregnant: ageSource?.is_pregnant || false,
                isBreastfeeding: ageSource?.is_breastfeeding || false,
                ageMonths,
                skinType: ageSource?.skin_type || 'normal',
                skinConditions: ageSource?.skin_conditions || [],
                cosmeticAllergens: ageSource?.cosmetic_allergens || [],
            };

            const safetyAnalysis = analyzeProductSafety(product, ageMonths, userPreferences);

            // Add the captured image as product image
            product.imageUrl = imageAsset.uri;

            hapticSuccess();
            router.replace({
                pathname: '/product-summary',
                params: { productData: JSON.stringify({ ...product, safetyAnalysis }) },
            });
        } catch (error) {
            console.error('[ScanError] Photo analysis error:', error);
            hapticError();
            setAnalyzing(false);
            setAnalysisStatus('');
            Alert.alert(
                'Analysis Failed',
                error.message || 'Could not read the label. Please try with a clearer photo.',
                [{ text: 'OK' }]
            );
        }
    };

    if (analyzing) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.blurTop} />
                <View style={styles.blurBottom} />

                {/* Exit button — always accessible during analysis */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.foreground} />
                    </Pressable>
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        {/* Animated scanning rings behind mascot */}
                        <ScanningRings size={180} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{analysisStatus}</Text>
                        <Text style={styles.subtitle}>
                            Our AI is reading the label and{'\n'}checking ingredients for safety
                        </Text>
                    </View>
                    <View style={styles.aiBadge}>
                        <Sparkles size={14} color={colors.chart1} />
                        <Text style={styles.aiBadgeText}>POWERED BY GOODFOR AI</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {/* Error icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.outerCircle} />
                    <View style={styles.iconCircle}>
                        <Search size={40} color={`${colors.primary}66`} />
                        <View style={styles.questionBadge}>
                            <HelpCircle size={20} color={colors.primary} />
                        </View>
                    </View>
                </View>

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>
                        {isDirectLabelScan
                            ? `Scan Product${"\n"}Label`
                            : `We couldn't find${"\n"}this product`
                        }
                    </Text>
                    <Text style={styles.subtitle}>
                        {isDirectLabelScan
                            ? `Take a photo of the ingredients list${"\n"}and our AI will analyse it for you.`
                            : `This product isn't in our database yet.${"\n"}Take a photo of the label and our AI will analyse it.`
                        }
                    </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={styles.primaryButton}
                        onPress={() => processImage('camera')}
                    >
                        <Camera size={20} color={colors.primaryForeground} />
                        <Text style={styles.buttonTextPrimary}>Take Photo of Label</Text>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => processImage('gallery')}
                    >
                        <ImageIcon size={20} color={colors.foreground} />
                        <Text style={styles.buttonTextSecondary}>Upload from Gallery</Text>
                    </Pressable>

                    {!isDirectLabelScan && (
                        <Pressable
                            style={styles.outlineButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.outlineButtonText}>Try scanning again</Text>
                        </Pressable>
                    )}
                </View>

                {/* AI disclaimer */}
                <View style={styles.aiBadge}>
                    <Sparkles size={14} color={colors.chart1} />
                    <Text style={styles.aiBadgeText}>AI-POWERED LABEL ANALYSIS</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={styles.footerText}>AI ANALYSIS MAY NOT BE 100% ACCURATE — VERIFY INGREDIENTS</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blurTop: {
        position: 'absolute',
        top: '25%',
        left: -128,
        width: 288,
        height: 288,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 144,
        marginTop: -144,
    },
    blurBottom: {
        position: 'absolute',
        bottom: '25%',
        right: -96,
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 128,
    },
    header: {
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[6],
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${colors.card}CC`,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[16],
    },
    iconContainer: {
        position: 'relative',
        marginBottom: spacing[10],
    },
    outerCircle: {
        position: 'absolute',
        top: -16,
        left: -16,
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: `${colors.accent}33`,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.border}80`,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        position: 'relative',
    },
    questionBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    textContainer: {
        alignItems: 'center',
        gap: spacing[4],
        marginBottom: spacing[12],
    },
    title: {
        fontSize: fontSizes['2xl'],
        fontFamily: fonts.sansBold,
        color: colors.primary,
        textAlign: 'center',
        lineHeight: fontSizes['2xl'] * 1.3,
    },
    subtitle: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: fontSizes.base * 1.5,
    },
    buttonContainer: {
        width: '100%',
        gap: spacing[3],
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: colors.primary,
        borderRadius: radius['2xl'],
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius['2xl'],
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        paddingVertical: 14,
        paddingHorizontal: 24,
    },
    buttonTextPrimary: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansSemiBold,
        color: colors.primaryForeground,
    },
    buttonTextSecondary: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
    },
    outlineButtonText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.mutedForeground,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing[6],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        backgroundColor: `${colors.chart1}10`,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: `${colors.chart1}20`,
    },
    aiBadgeText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.chart1,
        letterSpacing: 1.5,
    },
    footer: {
        paddingHorizontal: spacing[6],
        alignItems: 'center',
    },
    footerText: {
        fontSize: 9,
        fontFamily: fonts.sansBold,
        color: `${colors.mutedForeground}66`,
        letterSpacing: 1,
        textAlign: 'center',
    },
});
