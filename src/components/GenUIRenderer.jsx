import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import {
    ShieldCheck, ShieldAlert, AlertTriangle, Leaf, Heart,
    TrendingUp, TrendingDown, Minus, ChevronRight,
    Search, Bookmark, Share2, Package, Star, Info,
    CheckCircle, XCircle, AlertOctagon, Zap, Beaker,
    Droplets, Flame, Cookie, Wheat,
} from 'lucide-react-native';
import { colors, fonts, radius } from '@/constants/theme';
import {
    SafetyGauge,
    AllergenAlert,
    NutritionBreakdown,
    QuickActions,
} from './ChatUIComponents';

// ─────────────────────────────────────────────
// Entrance animation hook
// ─────────────────────────────────────────────
function useEntranceAnim(delay = 0) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(10)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 350, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return { opacity, transform: [{ translateY }] };
}

// ─────────────────────────────────────────────
// MAIN RENDERER
// ─────────────────────────────────────────────
export default function GenUIRenderer({
    content,
    productContext,
    isFirstAssistant = false,
    onAction,
    style,
}) {
    if (!content || typeof content !== 'string') {
        return <Text style={{ fontFamily: fonts.sans, color: colors.foreground }}>{content}</Text>;
    }

    // Parse the markdown into smart sections
    const sections = parseIntoSections(content);

    return (
        <View style={style}>
            {/* Deterministic components from product context (first message only) */}
            {isFirstAssistant && productContext?.safetyScore != null && (
                <SafetyGauge
                    score={productContext.safetyScore}
                    level={productContext.safetyLevel || 'UNKNOWN'}
                    label={getScoreLabel(productContext.safetyScore)}
                />
            )}

            {isFirstAssistant && extractAllergens(productContext).length > 0 && (
                <AllergenAlert
                    allergens={extractAllergens(productContext)}
                    severity={productContext.safetyScore < 40 ? 'high' : 'moderate'}
                    message={`Detected in ${productContext.name || 'this product'}`}
                />
            )}

            {/* Smart-rendered sections */}
            {sections.map((section, i) => renderSection(section, i, productContext))}

            {/* Quick actions for first assistant response */}
            {isFirstAssistant && productContext && (
                <QuickActions
                    actions={[
                        { label: 'Find alternatives', icon: 'alternatives', action: 'find_alternatives' },
                        { label: 'More details', icon: 'details', action: 'more_details' },
                        { label: 'Share results', icon: 'share', action: 'share_results' },
                    ]}
                    onAction={onAction}
                />
            )}
        </View>
    );
}

// ─────────────────────────────────────────────
// SECTION PARSER — splits markdown into renderable sections
// ─────────────────────────────────────────────
function parseIntoSections(text) {
    const sections = [];
    const lines = text.split('\n');

    let currentSection = null;
    let buffer = [];

    const flushBuffer = () => {
        if (buffer.length > 0) {
            if (currentSection) {
                currentSection.lines = [...buffer];
                sections.push(currentSection);
                currentSection = null;
            } else {
                sections.push({ type: 'text', lines: [...buffer] });
            }
            buffer = [];
        } else if (currentSection) {
            sections.push(currentSection);
            currentSection = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect section headers (## or ###)
        if (trimmed.match(/^#{1,3}\s+/)) {
            flushBuffer();
            const headerText = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');
            const sectionType = detectSectionType(headerText);
            currentSection = { type: 'card', title: headerText, sectionType, lines: [] };
            continue;
        }

        // Detect numbered lists with sub-bullets (ingredient analysis pattern)
        if (trimmed.match(/^\d+\.\s+\*\*/) && detectIngredientPattern(lines, i)) {
            flushBuffer();
            const ingredientSection = parseIngredientList(lines, i);
            sections.push(ingredientSection.section);
            i = ingredientSection.endIndex;
            continue;
        }

        buffer.push(line);
    }

    flushBuffer();

    return sections;
}

// Detect if a numbered list looks like an ingredient analysis
function detectIngredientPattern(lines, startIdx) {
    let count = 0;
    for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
        if (lines[i].trim().match(/^\d+\.\s+\*\*/)) count++;
    }
    return count >= 2; // At least 2 numbered bold items = ingredient list
}

// Parse a block of numbered ingredients with their sub-bullets
function parseIngredientList(lines, startIdx) {
    const items = [];
    let currentItem = null;
    let i = startIdx;

    while (i < lines.length) {
        const trimmed = lines[i].trim();

        // New numbered item (e.g., "1. **Sugar**")
        const numMatch = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*/);
        if (numMatch) {
            if (currentItem) items.push(currentItem);
            const rest = trimmed.replace(/^\d+\.\s+\*\*.+?\*\*\s*/, '').trim();
            currentItem = {
                name: numMatch[2],
                number: parseInt(numMatch[1]),
                details: [],
                subtitle: rest || null,
            };
            i++;
            continue;
        }

        // Sub-bullet under current item
        if (currentItem && (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• '))) {
            const bulletContent = trimmed.replace(/^[-*•]\s+/, '');
            currentItem.details.push(bulletContent);
            i++;
            continue;
        }

        // Indented continuation line
        if (currentItem && lines[i].startsWith('  ') && trimmed.length > 0) {
            currentItem.details.push(trimmed);
            i++;
            continue;
        }

        // Empty line — could be paragraph break between items
        if (trimmed === '' && currentItem) {
            // Check if next non-empty line is another numbered item
            let nextNonEmpty = i + 1;
            while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') nextNonEmpty++;
            if (nextNonEmpty < lines.length && lines[nextNonEmpty].trim().match(/^\d+\.\s+\*\*/)) {
                i++;
                continue;
            }
            // End of ingredient list
            break;
        }

        // Not a sub-item, end of ingredient block
        if (!trimmed.match(/^\d+\.\s/) && trimmed !== '') break;

        i++;
    }

    if (currentItem) items.push(currentItem);

    return {
        section: { type: 'ingredients', items },
        endIndex: i - 1,
    };
}

// Detect what kind of section a header represents
function detectSectionType(title) {
    const lower = title.toLowerCase();
    if (lower.includes('verdict') || lower.includes('summary') || lower.includes('overall') || lower.includes('conclusion'))
        return 'verdict';
    if (lower.includes('concern') || lower.includes('risk') || lower.includes('warning') || lower.includes('watch'))
        return 'warning';
    if (lower.includes('ingredient'))
        return 'ingredients';
    if (lower.includes('alternative') || lower.includes('suggestion') || lower.includes('recommend'))
        return 'positive';
    if (lower.includes('nutrition') || lower.includes('nutrient'))
        return 'nutrition';
    if (lower.includes('benefit') || lower.includes('good') || lower.includes('positive'))
        return 'positive';
    return 'info';
}

// ─────────────────────────────────────────────
// SECTION RENDERERS
// ─────────────────────────────────────────────
function renderSection(section, index, productContext) {
    if (section.type === 'card' && section.sectionType === 'nutrition') {
        return <NutritionSection key={index} section={section} productContext={productContext} delay={index * 60} />;
    }

    switch (section.type) {
        case 'ingredients':
            return <IngredientCards key={index} items={section.items} />;
        case 'card':
            return <SectionCard key={index} section={section} delay={index * 60} />;
        case 'text':
        default:
            return <TextBlock key={index} lines={section.lines} delay={index * 40} />;
    }
}

function NutritionSection({ section, productContext, delay }) {
    const anim = useEntranceAnim(delay);
    const items = [];
    
    // Parse the lines into items
    section.lines.forEach(line => {
        // Handle bold label with or without status in parentheses
        const match = line.match(/^[-*•]\s+\*\*(.+?):\*\*\s*(.+?)(?:\s*\((.+?)\))?$/);
        if (match) {
            items.push({
                label: match[1].trim(),
                value: match[2].trim(),
                status: match[3] ? match[3].trim() : null
            });
        } else {
            const match2 = line.match(/^[-*•]\s+\*\*(.+?):\*\*\s*(.+)$/);
            if (match2) {
                items.push({
                    label: match2[1].trim(),
                    value: match2[2].trim(),
                    status: null
                });
            }
        }
    });

    let score = productContext?.safetyScore != null ? productContext.safetyScore : 45;

    // If no score in productContext, try to calculate from status
    if (productContext?.safetyScore == null && items.length > 0) {
        let highCount = items.filter(i => i.status?.toLowerCase() === 'high' || i.status?.toLowerCase() === 'bad').length;
        let goodCount = items.filter(i => i.status?.toLowerCase() === 'good' || i.status?.toLowerCase() === 'low').length;
        score = Math.max(0, Math.min(100, 50 + (goodCount * 15) - (highCount * 15)));
    }

    return (
        <Animated.View style={[anim]}>
            <NutritionBreakdown 
                title={section.title.replace(/^[\d️⃣\s]+/, '').trim()} 
                items={items} 
                score={Math.round(score)} 
            />
        </Animated.View>
    );
}

// ─────────────────────────────────────────────
// INGREDIENT CARDS — premium styled ingredient analysis
// ─────────────────────────────────────────────
function IngredientCards({ items }) {
    return (
        <View style={ingredientStyles.container}>
            {items.map((item, i) => (
                <IngredientCard key={i} item={item} index={i} />
            ))}
        </View>
    );
}

function IngredientCard({ item, index }) {
    const anim = useEntranceAnim(index * 80);
    const severity = detectIngredientSeverity(item);
    const severityConfig = SEVERITY_CONFIG[severity];

    return (
        <Animated.View style={[ingredientStyles.card, { borderLeftColor: severityConfig.color }, anim]}>
            {/* Header */}
            <View style={ingredientStyles.cardHeader}>
                <View style={[ingredientStyles.numberBadge, { backgroundColor: `${severityConfig.color}15` }]}>
                    <Text style={[ingredientStyles.numberText, { color: severityConfig.color }]}>{item.number}</Text>
                </View>
                <Text style={ingredientStyles.ingredientName}>{item.name}</Text>
                <View style={[ingredientStyles.severityPill, { backgroundColor: `${severityConfig.color}12` }]}>
                    <severityConfig.icon size={10} color={severityConfig.color} />
                    <Text style={[ingredientStyles.severityText, { color: severityConfig.color }]}>
                        {severityConfig.label}
                    </Text>
                </View>
            </View>

            {/* Details */}
            {item.details.length > 0 && (
                <View style={ingredientStyles.detailsContainer}>
                    {item.details.map((detail, j) => {
                        const parsed = parseDetailLine(detail);
                        return (
                            <View key={j} style={ingredientStyles.detailRow}>
                                <View style={[ingredientStyles.detailDot, { backgroundColor: `${severityConfig.color}40` }]} />
                                <Text style={ingredientStyles.detailText}>
                                    {parsed.label ? (
                                        <>
                                            <Text style={ingredientStyles.detailLabel}>{parsed.label}: </Text>
                                            {parsed.content}
                                        </>
                                    ) : detail}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </Animated.View>
    );
}

const SEVERITY_CONFIG = {
    high: { color: colors.chart3, label: 'High Risk', icon: AlertOctagon },
    moderate: { color: colors.chart2, label: 'Moderate', icon: AlertTriangle },
    low: { color: colors.chart1, label: 'Low Risk', icon: CheckCircle },
    neutral: { color: colors.chart4, label: 'Neutral', icon: Info },
};

function detectIngredientSeverity(item) {
    const text = [item.name, ...item.details].join(' ').toLowerCase();
    if (text.match(/harmful|dangerous|avoid|cancer|toxic|banned|high risk|concern|unhealthy/))
        return 'high';
    if (text.match(/caution|moderate|watch|limit|excess|added|artificial|processed/))
        return 'moderate';
    if (text.match(/safe|natural|healthy|beneficial|good|organic|minimal/))
        return 'low';
    return 'neutral';
}

function parseDetailLine(text) {
    // Match patterns like "What it is: ..." or "Why it matters: ..."
    const colonMatch = text.match(/^(.+?):\s+(.+)/);
    if (colonMatch) {
        const label = colonMatch[1].replace(/\*\*/g, '');
        return { label, content: colonMatch[2] };
    }
    return { label: null, content: text };
}

const ingredientStyles = StyleSheet.create({
    container: { gap: 8, marginVertical: 4 },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 14,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    numberBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: { fontSize: 12, fontFamily: fonts.sansBold },
    ingredientName: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    severityPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    severityText: { fontSize: 10, fontFamily: fonts.sansBold, letterSpacing: 0.3 },
    detailsContainer: { marginTop: 10, gap: 6 },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    detailDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 6,
    },
    detailText: {
        flex: 1,
        fontSize: 13,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 19,
    },
    detailLabel: {
        fontFamily: fonts.sansMedium,
        color: colors.foreground,
    },
});

// ─────────────────────────────────────────────
// SECTION CARD — wraps titled sections in premium cards
// ─────────────────────────────────────────────
function SectionCard({ section, delay = 0 }) {
    const anim = useEntranceAnim(delay);
    const config = SECTION_STYLE_MAP[section.sectionType] || SECTION_STYLE_MAP.info;

    return (
        <Animated.View style={[sectionStyles.card, { borderTopColor: config.color }, anim]}>
            {/* Card header */}
            <View style={sectionStyles.header}>
                <View style={[sectionStyles.headerIcon, { backgroundColor: `${config.color}12` }]}>
                    <config.icon size={14} color={config.color} />
                </View>
                <Text style={sectionStyles.headerTitle}>{section.title}</Text>
            </View>

            {/* Card content */}
            <View style={sectionStyles.content}>
                {section.lines?.map((line, i) => renderSmartLine(line, i, config.color))}
            </View>
        </Animated.View>
    );
}

const SECTION_STYLE_MAP = {
    verdict: { color: colors.primary, icon: ShieldCheck },
    warning: { color: colors.chart3, icon: AlertTriangle },
    ingredients: { color: colors.chart2, icon: Beaker },
    positive: { color: colors.chart1, icon: Leaf },
    nutrition: { color: colors.chart5, icon: Zap },
    info: { color: colors.chart4, icon: Info },
};

const sectionStyles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: 16,
        marginVertical: 6,
        borderTopWidth: 3,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}80`,
    },
    headerIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 15,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    content: { gap: 2 },
});

// ─────────────────────────────────────────────
// TEXT BLOCK — renders paragraphs, bullets, lists with premium styling
// ─────────────────────────────────────────────
function TextBlock({ lines, delay = 0 }) {
    const anim = useEntranceAnim(delay);

    return (
        <Animated.View style={anim}>
            {lines.map((line, i) => renderSmartLine(line, i, colors.primary))}
        </Animated.View>
    );
}

function renderSmartLine(line, index, accentColor) {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 6 }} />;

    // Bullet points → styled list items
    if (trimmed.match(/^[-*•]\s+/)) {
        const content = trimmed.replace(/^[-*•]\s+/, '');
        return (
            <View key={index} style={lineStyles.bulletRow}>
                <View style={[lineStyles.bulletDot, { backgroundColor: `${accentColor}50` }]} />
                <Text style={lineStyles.bulletText}>
                    {renderInlineFormatting(content)}
                </Text>
            </View>
        );
    }

    // Numbered items (non-ingredient) → styled numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
        return (
            <View key={index} style={lineStyles.numberedRow}>
                <View style={[lineStyles.numBadge, { backgroundColor: `${accentColor}10` }]}>
                    <Text style={[lineStyles.numText, { color: accentColor }]}>{numMatch[1]}</Text>
                </View>
                <Text style={lineStyles.numberedText}>
                    {renderInlineFormatting(numMatch[2])}
                </Text>
            </View>
        );
    }

    // Regular paragraph
    return (
        <Text key={index} style={lineStyles.paragraph}>
            {renderInlineFormatting(trimmed)}
        </Text>
    );
}

// Inline formatting: **bold**, *italic*, `code`
function renderInlineFormatting(text) {
    const parts = [];
    // Split by bold, italic, and code patterns
    const regex = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|`.+?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<Text key={lastIndex}>{text.slice(lastIndex, match.index)}</Text>);
        }

        const m = match[0];
        if (m.startsWith('***') && m.endsWith('***')) {
            parts.push(
                <Text key={match.index} style={{ fontFamily: fonts.sansBold, fontStyle: 'italic', color: colors.foreground }}>
                    {m.slice(3, -3)}
                </Text>
            );
        } else if (m.startsWith('**') && m.endsWith('**')) {
            parts.push(
                <Text key={match.index} style={{ fontFamily: fonts.sansBold, color: colors.foreground }}>
                    {m.slice(2, -2)}
                </Text>
            );
        } else if (m.startsWith('*') && m.endsWith('*')) {
            parts.push(
                <Text key={match.index} style={{ fontStyle: 'italic', color: colors.mutedForeground }}>
                    {m.slice(1, -1)}
                </Text>
            );
        } else if (m.startsWith('`') && m.endsWith('`')) {
            parts.push(
                <Text key={match.index} style={lineStyles.inlineCode}>
                    {m.slice(1, -1)}
                </Text>
            );
        }

        lastIndex = match.index + m.length;
    }

    if (lastIndex < text.length) {
        parts.push(<Text key={lastIndex}>{text.slice(lastIndex)}</Text>);
    }

    return parts.length > 0 ? parts : text;
}

const lineStyles = StyleSheet.create({
    paragraph: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.foreground,
        lineHeight: 21,
        marginVertical: 2,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginVertical: 3,
        paddingLeft: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
    },
    bulletText: {
        flex: 1,
        fontSize: 13.5,
        fontFamily: fonts.sans,
        color: colors.foreground,
        lineHeight: 20,
    },
    numberedRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginVertical: 4,
    },
    numBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
    },
    numText: { fontSize: 12, fontFamily: fonts.sansBold },
    numberedText: {
        flex: 1,
        fontSize: 13.5,
        fontFamily: fonts.sans,
        color: colors.foreground,
        lineHeight: 20,
    },
    inlineCode: {
        fontFamily: 'Courier',
        fontSize: 12,
        backgroundColor: `${colors.muted}`,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        color: colors.chart3,
    },
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getScoreLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Poor';
    return 'Avoid';
}

function extractAllergens(ctx) {
    if (!ctx) return [];
    const allergens = [];
    if (Array.isArray(ctx.allergens)) {
        ctx.allergens.forEach(a => {
            if (typeof a === 'string') allergens.push(a);
        });
    }
    return [...new Set(allergens)].filter(Boolean);
}
