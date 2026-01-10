import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Camera, ShieldCheck, FileText, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius, shadows } from '@/constants/theme';
import { Button, Card } from '@/components/ui';

export default function HowScanningWorks() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {/* Main content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Steps card */}
                <Card style={styles.stepsCard}>
                    <View style={styles.stepsContainer}>
                        {/* Step 1 */}
                        <View style={styles.stepRow}>
                            <View style={styles.iconContainer}>
                                <Camera size={28} color={colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepLabel}>STEP 1</Text>
                                <Text style={styles.stepTitle}>Scan product</Text>
                            </View>
                        </View>
                        <View style={styles.connector} />

                        {/* Step 2 */}
                        <View style={styles.stepRow}>
                            <View style={styles.iconContainer}>
                                <ShieldCheck size={28} color={colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepLabel}>STEP 2</Text>
                                <Text style={styles.stepTitle}>Get safety score</Text>
                            </View>
                        </View>
                        <View style={styles.connector} />

                        {/* Step 3 */}
                        <View style={styles.stepRow}>
                            <View style={styles.iconContainer}>
                                <FileText size={28} color={colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepLabel}>STEP 3</Text>
                                <Text style={styles.stepTitle}>See why</Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Progress dots */}
                <View style={styles.progressDots}>
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dotBar, styles.dotActive]} />
                    <View style={[styles.dot, styles.dotInactive]} />
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        Scan & know{'\n'}in seconds
                    </Text>
                    <Text style={styles.description}>
                        No medical jargon. Just clear explanations that help you choose better.
                    </Text>
                </View>

                {/* Real-time badge */}
                <View style={styles.realtimeBadge}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.realtimeText}>Real-time analysis active</Text>
                </View>

                <View style={{ height: 200 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    variant="primary"
                    size="lg"
                    onPress={() => router.push('/onboarding/family-profiles')}
                    style={styles.nextButton}
                >
                    <Text style={styles.buttonText}>Next</Text>
                    <View style={styles.buttonIconContainer}>
                        <ArrowRight size={20} color={colors.primaryForeground} />
                    </View>
                </Button>

                <Pressable style={styles.signInButton}>
                    <Text style={styles.signInText}>
                        Already have an account? Sign in
                    </Text>
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
        bottom: '25%',
        left: -60,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[14],
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
    scrollView: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[10],
    },
    stepsCard: {
        marginTop: spacing[6],
        marginBottom: spacing[12],
    },
    stepsContainer: {
        gap: spacing[8],
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[5],
    },
    iconContainer: {
        width: 56,
        height: 56,
        backgroundColor: colors.accent,
        borderRadius: radius['2xl'],
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepContent: {
        flex: 1,
    },
    stepLabel: {
        fontSize: fontSizes.xs,
        fontFamily: fonts.sansBold,
        color: colors.chart1,
        letterSpacing: 1,
        marginBottom: 2,
    },
    stepTitle: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    connector: {
        width: 2,
        height: 32,
        backgroundColor: colors.accent,
        marginLeft: 28,
        opacity: 0.3,
    },
    progressDots: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: spacing[8],
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotBar: {
        height: 8,
        width: 24,
        borderRadius: 4,
    },
    dotActive: {
        backgroundColor: colors.chart1,
    },
    dotInactive: {
        backgroundColor: colors.mutedForeground,
        opacity: 0.3,
    },
    textContent: {
        gap: spacing[6],
    },
    title: {
        fontSize: fontSizes['5xl'],
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        lineHeight: fontSizes['5xl'] * 1.1,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: fontSizes.xl - 1,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.xl * 1.5,
        maxWidth: '90%',
    },
    realtimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.card,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: `${colors.border}66`,
        alignSelf: 'flex-start',
        marginTop: spacing[8],
    },
    pulseDot: {
        width: 8,
        height: 8,
        backgroundColor: colors.chart1,
        borderRadius: 4,
    },
    realtimeText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    footer: {
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[10],
        paddingTop: spacing[8],
        gap: spacing[4],
        backgroundColor: colors.background,
    },
    nextButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        flex: 1,
        textAlign: 'center',
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    buttonIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    signInButton: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[2],
    },
    signInText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansSemiBold,
        color: colors.mutedForeground,
        textAlign: 'center',
    },
});
