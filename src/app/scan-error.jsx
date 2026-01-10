import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, HelpCircle, Camera, Edit, Image as ImageIcon } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Button } from '@/components/ui';

export default function ScanError() {
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
                        We couldn't find{'\n'}this product
                    </Text>
                    <Text style={styles.subtitle}>
                        This product isn't in our database yet, but you can still continue.
                    </Text>
                </View>

                {/* Action buttons */}
                <View style={styles.buttonContainer}>
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={() => router.back()}
                        style={styles.button}
                    >
                        <Camera size={20} color={colors.primaryForeground} />
                        <Text style={styles.buttonTextPrimary}>Try scanning again</Text>
                    </Button>

                    <Button
                        variant="secondary"
                        size="lg"
                        style={styles.button}
                    >
                        <Edit size={20} color={colors.secondaryForeground} />
                        <Text style={styles.buttonTextSecondary}>Enter details manually</Text>
                    </Button>

                    <Pressable style={styles.outlineButton}>
                        <ImageIcon size={20} color={colors.primary} />
                        <Text style={styles.outlineButtonText}>Upload a photo</Text>
                    </Pressable>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>SAFE AND SECURE DATABASE</Text>
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
        paddingTop: spacing[14],
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
        paddingBottom: spacing[32],
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
        gap: spacing[4],
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
    },
    buttonTextPrimary: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansSemiBold,
        color: colors.primaryForeground,
    },
    buttonTextSecondary: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansSemiBold,
        color: colors.secondaryForeground,
    },
    outlineButton: {
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
    outlineButtonText: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansSemiBold,
        color: colors.primary,
    },
    footer: {
        paddingBottom: spacing[28],
        paddingHorizontal: spacing[6],
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: `${colors.mutedForeground}99`,
        letterSpacing: 1.5,
        marginBottom: spacing[5],
    },
});
