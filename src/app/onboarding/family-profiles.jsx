import { View, Text, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight, Users, Shield } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius, shadows } from '@/constants/theme';
import { Button, Card } from '@/components/ui';

export default function FamilyProfiles() {
    const router = useRouter();

    const profiles = [
        {
            name: 'Dad (Adult)',
            image: 'https://randomuser.me/api/portraits/men/32.jpg',
            restriction: 'No restrictions',
            score: 94,
            scoreLabel: 'Excellent',
            scoreColor: colors.chart1,
        },
        {
            name: 'Mia (7 yrs)',
            image: 'https://randomuser.me/api/portraits/women/44.jpg',
            restriction: 'Mild sensitivity',
            score: 68,
            scoreLabel: 'Caution',
            scoreColor: colors.chart2,
        },
        {
            name: 'Baby Leo',
            image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80',
            restriction: 'High sensitivity',
            score: 42,
            scoreLabel: 'Avoid',
            scoreColor: colors.chart3,
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
                {/* Profiles card */}
                <Card style={styles.profilesCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardLabel}>FAMILY INSIGHTS</Text>
                        <Shield size={20} color={colors.chart1} />
                    </View>

                    <View style={styles.profilesList}>
                        {profiles.map((profile, index) => (
                            <View key={index} style={styles.profileItem}>
                                <View style={styles.profileLeft}>
                                    <Image
                                        source={{ uri: profile.image }}
                                        style={[
                                            styles.profileImage,
                                            { borderColor: `${profile.scoreColor}4D` },
                                        ]}
                                    />
                                    <View>
                                        <Text style={styles.profileName}>{profile.name}</Text>
                                        <Text style={styles.profileRestriction}>{profile.restriction}</Text>
                                    </View>
                                </View>
                                <View style={styles.profileRight}>
                                    <Text style={[styles.profileScore, { color: profile.scoreColor }]}>
                                        {profile.score}
                                    </Text>
                                    <Text style={[styles.profileScoreLabel, { color: profile.scoreColor }]}>
                                        {profile.scoreLabel}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Progress dots */}
                <View style={styles.progressDots}>
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dot, styles.dotInactive]} />
                    <View style={[styles.dotBar, styles.dotActive]} />
                </View>

                {/* Text content */}
                <View style={styles.textContent}>
                    <Text style={styles.title}>
                        Different Members{'\n'}Different needs
                    </Text>
                    <Text style={styles.description}>
                        Get age-adjusted safety ratings specifically tailored for the babies, children, and adults in your household.
                    </Text>
                </View>

                {/* Multi-profile badge */}
                <View style={styles.badge}>
                    <Users size={20} color={colors.chart1} />
                    <Text style={styles.badgeText}>Multi-profile support</Text>
                </View>


            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Button
                    variant="primary"
                    size="lg"
                    onPress={() => router.push('/onboarding/safety-scoring')}
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
    profilesCard: {
        marginTop: spacing[6],
        marginBottom: spacing[12],
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[2],
    },
    cardLabel: {
        fontSize: fontSizes.xs,
        fontFamily: fonts.sansBold,
        color: colors.chart1,
        letterSpacing: 1,
    },
    profilesList: {
        gap: spacing[6],
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[3],
        backgroundColor: colors.background,
        borderRadius: radius['2xl'],
    },
    profileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
    },
    profileImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
    },
    profileName: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    profileRestriction: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    profileRight: {
        alignItems: 'flex-end',
    },
    profileScore: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
    },
    profileScoreLabel: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
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
        marginTop: spacing[2],
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
    badge: {
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
        marginTop: spacing[10],
    },
    badgeText: {
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
