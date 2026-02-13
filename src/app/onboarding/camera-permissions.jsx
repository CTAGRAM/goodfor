import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera as CameraIcon, ArrowLeft } from 'lucide-react-native';
import { Camera } from 'expo-camera';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, fontSizes, spacing, radius, shadows } from '@/constants/theme';
import { Button } from '@/components/ui';

export default function CameraPermissions() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleAllowCamera = async () => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();

            if (status === 'granted') {
                router.push('/onboarding/complete');
            } else {
                Alert.alert(
                    'Permission Denied',
                    'Camera access is needed to scan barcodes. You can enable it in your device settings.',
                    [
                        { text: 'Skip for now', onPress: () => router.push('/onboarding/complete') },
                        { text: 'Try Again', onPress: handleAllowCamera },
                    ]
                );
            }
        } catch (error) {
            console.error('Camera permission error:', error);
            router.push('/onboarding/complete');
        }
    };

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

            {/* Main content */}
            <View style={styles.content}>
                {/* Camera icon */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <CameraIcon size={80} color={colors.primary} strokeWidth={1.5} />
                        </View>
                    </View>
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        Camera access{'\n'}needed
                    </Text>
                    <Text style={styles.description}>
                        We need camera access to scan product barcodes. Your privacy is our priority — we never store photos.
                    </Text>
                </View>

                {/* Privacy points */}
                <View style={styles.privacyPoints}>
                    <View style={styles.privacyPoint}>
                        <View style={styles.checkmark} />
                        <Text style={styles.privacyText}>Photos are never saved</Text>
                    </View>
                    <View style={styles.privacyPoint}>
                        <View style={styles.checkmark} />
                        <Text style={styles.privacyText}>Only used for scanning</Text>
                    </View>
                    <View style={styles.privacyPoint}>
                        <View style={styles.checkmark} />
                        <Text style={styles.privacyText}>You can revoke anytime</Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <Button
                    variant="primary"
                    size="lg"
                    onPress={handleAllowCamera}
                    style={{ marginBottom: 16 }}
                >
                    Allow camera access
                </Button>

                <Pressable
                    style={styles.skipButton}
                    onPress={() => router.push('/onboarding/complete')}
                >
                    <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
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
        top: -80,
        right: -80,
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 128,
    },
    blurBottom: {
        position: 'absolute',
        bottom: '30%',
        left: -60,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[4],
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        marginLeft: -12,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[8],
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing[8],
    },
    iconOuter: {
        width: 180,
        height: 180,
        backgroundColor: `${colors.accent}4D`,
        borderRadius: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconInner: {
        width: 140,
        height: 140,
        backgroundColor: `${colors.accent}66`,
        borderRadius: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
        gap: spacing[4],
        alignItems: 'center',
        marginBottom: spacing[8],
    },
    title: {
        fontSize: fontSizes['4xl'],
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        lineHeight: 48,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    description: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 24,
        textAlign: 'center',
        maxWidth: '90%',
    },
    privacyPoints: {
        gap: spacing[3],
        alignSelf: 'stretch',
    },
    privacyPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    checkmark: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.chart1,
    },
    privacyText: {
        fontSize: fontSizes.md,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    footer: {
        paddingHorizontal: spacing[8],
        paddingTop: spacing[4],
        backgroundColor: colors.background, // Ensure background covers any content below
    },
    skipButton: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3],
        alignItems: 'center',
    },
    skipText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.mutedForeground,
    },
});
