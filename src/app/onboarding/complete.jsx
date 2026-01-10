import { View, Text, Animated, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { CheckCircle } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing } from '@/constants/theme';
import { Button } from '@/components/ui';

export default function OnboardingComplete() {
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate success icon
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Fade in content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay: 200,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />
            <View style={styles.blurCenter} />

            {/* Main content */}
            <View style={styles.content}>
                {/* Success icon */}
                <Animated.View
                    style={[
                        styles.iconContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.iconOuter}>
                        <View style={styles.iconInner}>
                            <CheckCircle size={80} color={colors.chart1} fill={colors.chart1} />
                        </View>
                    </View>
                </Animated.View>

                {/* Text content */}
                <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>
                        You're all set!
                    </Text>
                    <Text style={styles.description}>
                        Start scanning products to get personalized safety insights for your family.
                    </Text>
                </Animated.View>

                {/* Features list */}
                <Animated.View style={[styles.featuresList, { opacity: fadeAnim }]}>
                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>Instant product analysis</Text>
                    </View>
                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>Age-aware safety scores</Text>
                    </View>
                    <View style={styles.feature}>
                        <View style={styles.featureDot} />
                        <Text style={styles.featureText}>Personalized recommendations</Text>
                    </View>
                </Animated.View>
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Button
                    variant="primary"
                    size="lg"
                    onPress={() => router.push('/sign-in')}
                >
                    Go to your account
                </Button>
            </Animated.View>
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
        top: -100,
        right: -100,
        width: 320,
        height: 320,
        backgroundColor: colors.accent,
        opacity: 0.4,
        borderRadius: 160,
    },
    blurBottom: {
        position: 'absolute',
        bottom: -120,
        left: -120,
        width: 384,
        height: 384,
        backgroundColor: colors.chart1,
        opacity: 0.1,
        borderRadius: 192,
    },
    blurCenter: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        opacity: 0.2,
        borderRadius: 128,
        marginLeft: -128,
        marginTop: -128,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[8],
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: spacing[12],
    },
    iconOuter: {
        width: 200,
        height: 200,
        backgroundColor: `${colors.chart1}1A`,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconInner: {
        width: 160,
        height: 160,
        backgroundColor: `${colors.chart1}26`,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
        gap: spacing[6],
        alignItems: 'center',
        marginBottom: spacing[10],
    },
    title: {
        fontSize: fontSizes['5xl'] + 6,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    description: {
        fontSize: fontSizes.xl - 1,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.xl * 1.5,
        textAlign: 'center',
        maxWidth: '85%',
    },
    featuresList: {
        gap: spacing[4],
        alignSelf: 'stretch',
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.chart1,
    },
    featureText: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
    footer: {
        paddingHorizontal: spacing[8],
        paddingBottom: spacing[10],
        paddingTop: spacing[8],
    },
});
