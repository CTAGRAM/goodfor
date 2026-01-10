import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Button, Card } from '@/components/ui';

export default function SafetyScoring() {
    const router = useRouter();

    const scoreRanges = [
        {
            icon: CheckCircle,
            label: 'Safe',
            range: '80-100 Score range',
            score: 94,
            color: colors.chart1,
        },
        {
            icon: AlertTriangle,
            label: 'Use with caution',
            range: '40-79 Score range',
            score: 52,
            color: colors.chart2,
        },
        {
            icon: XCircle,
            label: 'Avoid',
            range: '0-39 Score range',
            score: 28,
            color: colors.chart3,
        },
    ];

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
                {/* Scoring card */}
                <Card style={styles.scoringCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>SCORING SYSTEM</Text>
                    </View>

                    <View style={styles.scoresList}>
                        {scoreRanges.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.scoreItem,
                                        { borderColor: `${item.color}1A` },
                                    ]}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: `${item.color}1A` }]}>
                                        <Icon size={24} color={item.color} />
                                    </View>
                                    <View style={styles.scoreContent}>
                                        <Text style={styles.scoreLabel}>{item.label}</Text>
                                        <Text style={styles.scoreRange}>{item.range}</Text>
                                    </View>
                                    <View style={[styles.scoreBadge, { backgroundColor: item.color }]}>
                                        <Text style={styles.scoreValue}>{item.score}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* Progress dots */}
                <View style={styles.progressDots}>
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dotBar, styles.dotActive]} />
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        Transparent{'\n'}safety scores
                    </Text>
                    <Text style={styles.description}>
                        Our science-backed scores are based on deep ingredient research. Shop with confidence knowing exactly what goes into your body.
                    </Text>
                </View>

                <View style={{ height: 200 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    variant="primary"
                    size="lg"
                    onPress={() => router.push('/onboarding/camera-permissions')}
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
        right: -60,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.1,
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
    },
    scoringCard: {
        marginTop: spacing[6],
        marginBottom: spacing[10],
    },
    cardHeader: {
        marginBottom: spacing[4],
    },
    cardLabel: {
        fontSize: fontSizes.xs,
        fontFamily: fonts.sansBold,
        color: colors.primary,
        letterSpacing: 1,
    },
    scoresList: {
        gap: spacing[4],
    },
    scoreItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        padding: spacing[4],
        backgroundColor: colors.background,
        borderRadius: radius['2xl'],
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreContent: {
        flex: 1,
    },
    scoreLabel: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    scoreRange: {
        fontSize: 10,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    scoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.lg,
    },
    scoreValue: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
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
        gap: spacing[4],
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
