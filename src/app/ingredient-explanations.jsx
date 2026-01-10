import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, CheckCircle, AlertTriangle, Share2 } from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { Card } from '@/components/ui';

export default function IngredientExplanations() {
    const router = useRouter();

    const ingredients = [
        {
            name: 'Purified Water',
            safety: 'safe',
            safetyLabel: 'Generally safe',
            description: 'Cleaned and filtered water used as the base for this drink to ensure purity and safety.',
            details: 'Water is essential for hydration and provides the liquid texture needed to mix all other ingredients evenly.',
            icon: CheckCircle,
            color: colors.chart1,
        },
        {
            name: 'Cane Sugar',
            safety: 'caution',
            safetyLabel: 'Needs caution',
            description: 'A natural sweetener made from sugar cane plants to improve the overall taste.',
            details: null,
            icon: AlertTriangle,
            color: colors.chart2,
        },
        {
            name: 'Citric Acid',
            safety: 'safe',
            safetyLabel: 'Generally safe',
            description: 'A natural substance found in citrus fruits like lemons and limes, used to keep food fresh.',
            details: null,
            icon: CheckCircle,
            color: colors.chart1,
        },
        {
            name: 'Pectin',
            safety: 'safe',
            safetyLabel: 'Generally safe',
            description: 'A type of fiber found in many fruits that helps give foods a smooth, thick consistency.',
            details: null,
            icon: CheckCircle,
            color: colors.chart1,
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Background blurs */}
            <View style={styles.blurTop} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </Pressable>
                <View style={{ flex: 1 }} />
                <Pressable style={styles.backButton}>
                    <Search size={24} color={colors.foreground} />
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Ingredient Glossary</Text>
                    <Text style={styles.subtitle}>
                        Simple, honest explanations for every ingredient in this product. No jargon, just the facts.
                    </Text>
                </View>

                {/* Ingredients List */}
                <View style={styles.ingredientsList}>
                    {ingredients.map((ingredient, index) => {
                        const Icon = ingredient.icon;
                        return (
                            <Card key={index} style={styles.ingredientCard}>
                                <View style={styles.ingredientHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                        <View style={[
                                            styles.safetyBadge,
                                            { backgroundColor: `${ingredient.color}1A` }
                                        ]}>
                                            <Text style={[styles.safetyBadgeText, { color: ingredient.color }]}>
                                                {ingredient.safetyLabel}
                                            </Text>
                                        </View>
                                    </View>
                                    <Icon size={24} color={ingredient.color} />
                                </View>

                                <Text style={styles.ingredientDescription}>{ingredient.description}</Text>

                                {ingredient.details && (
                                    <View style={styles.ingredientDetails}>
                                        <Text style={styles.detailsTitle}>WHY THIS INGREDIENT MATTERS</Text>
                                        <Text style={styles.detailsText}>{ingredient.details}</Text>
                                    </View>
                                )}
                            </Card>
                        );
                    })}
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>Our Standard</Text>
                    <Text style={styles.infoText}>
                        Our labels are based on the latest health guidelines and independent research. We focus on transparency so you can shop with confidence.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Pressable style={styles.shareButton}>
                    <Share2 size={20} color={colors.primaryForeground} />
                    <Text style={styles.shareButtonText}>Share Analysis</Text>
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
        top: -128,
        right: -128,
        width: 256,
        height: 256,
        backgroundColor: colors.accent,
        opacity: 0.3,
        borderRadius: 128,
    },
    blurLeft: {
        position: 'absolute',
        top: '25%',
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: spacing[14],
        paddingBottom: spacing[4],
        paddingHorizontal: spacing[6],
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[6],
    },
    titleSection: {
        marginTop: spacing[4],
        marginBottom: spacing[8],
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
        lineHeight: 34,
        marginBottom: spacing[3],
    },
    subtitle: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.base * 1.5,
    },
    ingredientsList: {
        gap: spacing[4],
    },
    ingredientCard: {
        padding: spacing[5],
    },
    ingredientHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing[3],
    },
    ingredientName: {
        fontSize: fontSizes.lg,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[1],
    },
    safetyBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    safetyBadgeText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    ingredientDescription: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: fontSizes.sm * 1.5,
        marginBottom: spacing[4],
    },
    ingredientDetails: {
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: `${colors.border}80`,
    },
    detailsTitle: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        letterSpacing: 1.5,
        marginBottom: spacing[2],
    },
    detailsText: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sans,
        color: `${colors.foreground}CC`,
        lineHeight: fontSizes.sm * 1.5,
    },
    infoBox: {
        marginTop: spacing[8],
        marginBottom: spacing[6],
        padding: spacing[6],
        borderRadius: radius['3xl'],
        backgroundColor: `${colors.accent}33`,
        borderWidth: 1,
        borderColor: colors.accent,
    },
    infoTitle: {
        fontSize: fontSizes.sm,
        fontFamily: fonts.sansBold,
        color: colors.primary,
        marginBottom: spacing[2],
    },
    infoText: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    footer: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    shareButtonText: {
        fontSize: fontSizes.base,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
});
