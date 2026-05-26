import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    ScrollView,
    Image,
} from 'react-native';
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    Leaf,
    Heart,
    Star,
    ArrowRight,
    Bookmark,
    Share2,
    Search,
    Package,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronRight,
    Info,
    Hexagon,
    Droplets,
    Flame
} from 'lucide-react-native';
import { colors, fonts, radius } from '@/constants/theme';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

// ─────────────────────────────────────────────
// Shared entrance animation hook
// ─────────────────────────────────────────────
function useEntranceAnim(delay = 0) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(12)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 400,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return { opacity, transform: [{ translateY }] };
}

// ─────────────────────────────────────────────
// 1. SafetyGauge — Animated circular score
// ─────────────────────────────────────────────
export function SafetyGauge({ score = 0, level = 'SAFE', label }) {
    const anim = useEntranceAnim(100);
    const animatedScore = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedScore, {
            toValue: score,
            duration: 800,
            delay: 200,
            useNativeDriver: false,
        }).start();
    }, [score]);

    const getColor = () => {
        if (score >= 70) return colors.chart1;
        if (score >= 40) return colors.chart2;
        return colors.chart3;
    };

    const getIcon = () => {
        if (score >= 70) return <ShieldCheck size={18} color="#fff" />;
        if (score >= 40) return <ShieldAlert size={18} color="#fff" />;
        return <AlertTriangle size={18} color="#fff" />;
    };

    const color = getColor();
    const displayLabel = label || (score >= 70 ? 'Safe' : score >= 40 ? 'Moderate' : 'Risky');

    return (
        <Animated.View style={[gaugeStyles.container, anim]}>
            <View style={gaugeStyles.content}>
                {/* Score circle */}
                <View style={[gaugeStyles.circle, { borderColor: `${color}30` }]}>
                    <View style={[gaugeStyles.innerCircle, { backgroundColor: `${color}12` }]}>
                        <Text style={[gaugeStyles.scoreText, { color }]}>{score}</Text>
                        <Text style={[gaugeStyles.outOf, { color: `${color}90` }]}>/100</Text>
                    </View>
                </View>

                {/* Info section */}
                <View style={gaugeStyles.info}>
                    <View style={[gaugeStyles.badge, { backgroundColor: `${color}18` }]}>
                        <View style={[gaugeStyles.badgeIcon, { backgroundColor: color }]}>
                            {getIcon()}
                        </View>
                        <Text style={[gaugeStyles.badgeText, { color }]}>{displayLabel}</Text>
                    </View>
                    <Text style={gaugeStyles.levelText}>{level.replace(/_/g, ' ')}</Text>

                    {/* Score bar */}
                    <View style={gaugeStyles.barBg}>
                        <View style={[gaugeStyles.barFill, { width: `${score}%`, backgroundColor: color }]} />
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}

const gaugeStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    circle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: { fontSize: 26, fontFamily: fonts.heading, lineHeight: 30 },
    outOf: { fontSize: 11, fontFamily: fonts.sans, marginTop: -2 },
    info: { flex: 1 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingRight: 12,
        marginBottom: 6,
    },
    badgeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    badgeText: { fontSize: 13, fontFamily: fonts.sansBold },
    levelText: {
        fontSize: 11,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    barBg: {
        height: 6,
        backgroundColor: colors.muted,
        borderRadius: 3,
        overflow: 'hidden',
    },
    barFill: { height: 6, borderRadius: 3 },
});


// ─────────────────────────────────────────────
// 2. ProductCard — Compact product info
// ─────────────────────────────────────────────
export function ProductCard({ name, brand, score, level, imageUrl, onPress }) {
    const anim = useEntranceAnim(150);

    const getColor = () => {
        if (!score) return colors.mutedForeground;
        if (score >= 70) return colors.chart1;
        if (score >= 40) return colors.chart2;
        return colors.chart3;
    };

    const color = getColor();

    return (
        <Animated.View style={[productStyles.container, anim]}>
            <TouchableOpacity
                style={productStyles.inner}
                onPress={onPress}
                activeOpacity={0.7}
                disabled={!onPress}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={productStyles.image} />
                ) : (
                    <View style={[productStyles.image, productStyles.placeholder]}>
                        <Package size={20} color={colors.primary} />
                    </View>
                )}
                <View style={productStyles.info}>
                    <Text style={productStyles.name} numberOfLines={1}>{name}</Text>
                    {brand ? <Text style={productStyles.brand}>{brand}</Text> : null}
                </View>
                {score != null && (
                    <View style={[productStyles.scoreBadge, { backgroundColor: `${color}15` }]}>
                        <Text style={[productStyles.scoreText, { color }]}>{score}</Text>
                        <Text style={[productStyles.scoreLabel, { color: `${color}90` }]}>
                            {level || (score >= 70 ? 'Safe' : score >= 40 ? 'OK' : 'Risk')}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const productStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    inner: { flexDirection: 'row', alignItems: 'center', padding: 12 },
    image: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.muted,
        marginRight: 12,
    },
    placeholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${colors.primary}08`,
    },
    info: { flex: 1 },
    name: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.foreground },
    brand: { fontSize: 12, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: 2 },
    scoreBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: { fontSize: 18, fontFamily: fonts.heading, lineHeight: 22 },
    scoreLabel: { fontSize: 9, fontFamily: fonts.sans, marginTop: -1 },
});


// ─────────────────────────────────────────────
// 3. AllergenAlert — Warning banner
// ─────────────────────────────────────────────
export function AllergenAlert({ allergens = [], severity = 'high', message }) {
    const anim = useEntranceAnim(100);

    const isHigh = severity === 'high';
    const bgColor = isHigh ? `${colors.chart3}10` : `${colors.chart2}10`;
    const borderColor = isHigh ? `${colors.chart3}30` : `${colors.chart2}30`;
    const iconColor = isHigh ? colors.chart3 : colors.chart2;
    const textColor = isHigh ? colors.chart3 : colors.chart2;

    return (
        <Animated.View style={[alertStyles.container, { backgroundColor: bgColor, borderColor }, anim]}>
            <View style={[alertStyles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
                <AlertTriangle size={18} color={iconColor} />
            </View>
            <View style={alertStyles.content}>
                <Text style={[alertStyles.title, { color: textColor }]}>
                    {isHigh ? 'Allergen Warning' : 'Allergen Notice'}
                </Text>
                {allergens.length > 0 && (
                    <View style={alertStyles.tagsRow}>
                        {allergens.map((a, i) => (
                            <View key={i} style={[alertStyles.tag, { backgroundColor: `${iconColor}15` }]}>
                                <Text style={[alertStyles.tagText, { color: textColor }]}>{a}</Text>
                            </View>
                        ))}
                    </View>
                )}
                {message ? (
                    <Text style={alertStyles.message}>{message}</Text>
                ) : null}
            </View>
        </Animated.View>
    );
}

const alertStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 14,
        marginVertical: 8,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: { flex: 1 },
    title: { fontSize: 14, fontFamily: fonts.sansBold, marginBottom: 6 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
    tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 12, fontFamily: fonts.sansMedium },
    message: { fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground, lineHeight: 18 },
});


// ─────────────────────────────────────────────
// 4. NutritionBreakdown — Premium stacked card
// ─────────────────────────────────────────────
export function NutritionBreakdown({ items = [], title, score = 45 }) {
    const anim = useEntranceAnim(200);

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'good':
            case 'low': return { color: colors.chart1, bg: `${colors.chart1}18`, label: 'Good', barPct: 0.3 };
            case 'moderate':
            case 'medium': return { color: colors.chart2, bg: `${colors.chart2}18`, label: 'Moderate', barPct: 0.6 };
            case 'high':
            case 'bad': return { color: colors.chart3, bg: `${colors.chart3}18`, label: 'High', barPct: 0.9 };
            default: return { color: colors.chart4, bg: `${colors.chart4}18`, label: status || '—', barPct: 0.5 };
        }
    };

    const getIconForLabel = (label) => {
        const l = label?.toLowerCase() || '';
        if (l.includes('sugar')) return <Hexagon size={15} color={colors.chart3} />;
        if (l.includes('fat') || l.includes('saturated')) return <Droplets size={15} color={colors.chart2} />;
        if (l.includes('fiber') || l.includes('fibre')) return <Leaf size={15} color={colors.chart1} />;
        if (l.includes('calorie') || l.includes('energy')) return <Flame size={15} color={colors.chart2} />;
        if (l.includes('sodium') || l.includes('salt')) return <Package size={15} color={colors.chart3} />;
        if (l.includes('protein')) return <TrendingUp size={15} color={colors.chart1} />;
        if (l.includes('caffeine')) return <Flame size={15} color={colors.chart3} />;
        return <Package size={15} color={colors.mutedForeground} />;
    };

    // Overall status based on score
    const overallConfig = getStatusConfig(score >= 70 ? 'good' : score >= 40 ? 'moderate' : 'high');

    // SVG Circle Math
    const size = 120;
    const strokeWidth = 10;
    const center = size / 2;
    const radiusSvg = center - strokeWidth;
    const circumference = 2 * Math.PI * radiusSvg;
    const arcLength = circumference * 0.75;
    const gapLength = circumference * 0.25;
    const strokeDasharray = `${arcLength} ${gapLength}`;
    const progressLength = arcLength * (score / 100);
    const progressDasharray = `${progressLength} ${circumference}`;
    const rotation = 135;

    return (
        <Animated.View style={[nStyles.container, anim]}>
            {/* Header */}
            <View style={nStyles.header}>
                <Text style={nStyles.title}>{title || 'Nutrition Analysis'}</Text>
                <View style={[nStyles.badge, { backgroundColor: overallConfig.bg }]}>
                    <Text style={[nStyles.badgeText, { color: overallConfig.color }]}>
                        {overallConfig.label}
                    </Text>
                </View>
            </View>

            {/* Gauge — centered */}
            <View style={nStyles.gaugeSection}>
                <View style={nStyles.svgWrap}>
                    <Svg width={size} height={size}>
                        <G rotation={rotation} origin={`${center}, ${center}`}>
                            <Circle
                                cx={center} cy={center} r={radiusSvg}
                                stroke={colors.muted} strokeWidth={strokeWidth}
                                strokeLinecap="round" strokeDasharray={strokeDasharray}
                                fill="transparent"
                            />
                            <Circle
                                cx={center} cy={center} r={radiusSvg}
                                stroke={overallConfig.color} strokeWidth={strokeWidth}
                                strokeLinecap="round" strokeDasharray={progressDasharray}
                                fill="transparent"
                            />
                        </G>
                    </Svg>
                    <View style={nStyles.scoreCenter}>
                        <Text style={nStyles.scoreNum}>{score}</Text>
                        <Text style={nStyles.scoreDenom}>/100</Text>
                    </View>
                </View>
                <View style={nStyles.scoreLabel}>
                    <Text style={nStyles.scoreLabelText}>Nutrition Score</Text>
                    <Info size={12} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                </View>
            </View>

            {/* Divider */}
            <View style={nStyles.divider} />

            {/* Nutrient Rows — full width */}
            <View style={nStyles.nutrientList}>
                {items.map((item, i) => {
                    const config = getStatusConfig(item.status);
                    return (
                        <View key={i} style={nStyles.nutrientRow}>
                            <View style={nStyles.nutrientLeft}>
                                <View style={[nStyles.nutrientIcon, { backgroundColor: `${config.color}15` }]}>
                                    {getIconForLabel(item.label)}
                                </View>
                                <Text style={nStyles.nutrientName} numberOfLines={1}>{item.label}</Text>
                            </View>
                            <View style={nStyles.nutrientRight}>
                                <Text style={[nStyles.nutrientValue, { color: config.color }]}>
                                    {item.value}
                                </Text>
                                {item.status && (
                                    <View style={[nStyles.statusPill, { backgroundColor: config.bg }]}>
                                        <Text style={[nStyles.statusPillText, { color: config.color }]}>
                                            {config.label}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

const nStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 17,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        marginLeft: 12,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    gaugeSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    svgWrap: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreNum: {
        fontSize: 36,
        fontFamily: fonts.heading,
        color: colors.foreground,
        lineHeight: 40,
    },
    scoreDenom: {
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: -2,
    },
    scoreLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    scoreLabelText: {
        fontSize: 12,
        fontFamily: fonts.sansMedium,
        color: colors.mutedForeground,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginBottom: 16,
    },
    nutrientList: {
        gap: 8,
    },
    nutrientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: `${colors.muted}80`,
        borderRadius: 14,
    },
    nutrientLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    nutrientIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    nutrientName: {
        fontSize: 14,
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
        flex: 1,
    },
    nutrientRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    nutrientValue: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
    },
    statusPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusPillText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
    },
});


// ─────────────────────────────────────────────
// 5. AlternativesList — Healthier options
// ─────────────────────────────────────────────
export function AlternativesList({ items = [], title, onItemPress }) {
    const anim = useEntranceAnim(250);

    return (
        <Animated.View style={[altStyles.container, anim]}>
            <View style={altStyles.header}>
                <View style={altStyles.headerIcon}>
                    <Leaf size={14} color={colors.chart1} />
                </View>
                <Text style={altStyles.title}>{title || 'Healthier Alternatives'}</Text>
            </View>
            {items.map((item, i) => {
                const scoreColor = (item.score >= 70) ? colors.chart1
                    : (item.score >= 40) ? colors.chart2
                    : colors.chart3;

                return (
                    <TouchableOpacity
                        key={i}
                        style={altStyles.item}
                        onPress={() => onItemPress?.(item)}
                        activeOpacity={0.7}
                        disabled={!onItemPress}
                    >
                        <View style={[altStyles.rank, { backgroundColor: `${colors.primary}08` }]}>
                            <Text style={altStyles.rankText}>{i + 1}</Text>
                        </View>
                        <View style={altStyles.itemInfo}>
                            <Text style={altStyles.itemName} numberOfLines={1}>{item.name}</Text>
                            {item.brand && <Text style={altStyles.itemBrand}>{item.brand}</Text>}
                            {item.reason && (
                                <Text style={altStyles.itemReason} numberOfLines={1}>{item.reason}</Text>
                            )}
                        </View>
                        {item.score != null && (
                            <View style={[altStyles.scorePill, { backgroundColor: `${scoreColor}12` }]}>
                                <Text style={[altStyles.scoreNum, { color: scoreColor }]}>{item.score}</Text>
                            </View>
                        )}
                        <ChevronRight size={16} color={colors.mutedForeground} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                );
            })}
        </Animated.View>
    );
}

const altStyles = StyleSheet.create({
    container: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: `${colors.chart1}20`,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
    headerIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${colors.chart1}12`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.foreground },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: `${colors.border}60`,
    },
    rank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    rankText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.primary },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontFamily: fonts.sansMedium, color: colors.foreground },
    itemBrand: { fontSize: 11, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: 1 },
    itemReason: { fontSize: 11, fontFamily: fonts.sans, color: colors.chart1, marginTop: 2 },
    scorePill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreNum: { fontSize: 14, fontFamily: fonts.heading },
});


// ─────────────────────────────────────────────
// 6. QuickActions — Tappable buttons
// ─────────────────────────────────────────────
const ACTION_ICONS = {
    save: Bookmark,
    bookmark: Bookmark,
    favorite: Heart,
    share: Share2,
    search: Search,
    compare: ArrowRight,
    scan: Search,
    alternatives: Leaf,
    details: Package,
    default: Star,
};

export function QuickActions({ actions = [], onAction }) {
    const anim = useEntranceAnim(300);

    return (
        <Animated.View style={[qaStyles.container, anim]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={qaStyles.scroll}
            >
                {actions.map((action, i) => {
                    const IconComp = ACTION_ICONS[action.icon?.toLowerCase()] || ACTION_ICONS.default;
                    return (
                        <TouchableOpacity
                            key={i}
                            style={qaStyles.button}
                            onPress={() => onAction?.(action.action || action.label)}
                            activeOpacity={0.7}
                        >
                            <View style={qaStyles.iconWrap}>
                                <IconComp size={16} color={colors.primary} />
                            </View>
                            <Text style={qaStyles.label} numberOfLines={1}>{action.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </Animated.View>
    );
}

const qaStyles = StyleSheet.create({
    container: { marginVertical: 8 },
    scroll: { gap: 8 },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: { fontSize: 13, fontFamily: fonts.sansMedium, color: colors.foreground },
});


// ─────────────────────────────────────────────
// Component Registry — maps type strings to components
// ─────────────────────────────────────────────
export const GENUI_COMPONENTS = {
    SafetyGauge,
    ProductCard,
    AllergenAlert,
    NutritionBreakdown,
    AlternativesList,
    QuickActions,
};
