import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

/**
 * GoodFor Home Screen Premium Widget
 * Light theme matching the app's aesthetic — white cards, green accents, clean typography.
 * Supports: Small (2×2), Medium (4×2), Large (4×4)
 */

// ─── PALETTE ───────────────────────────────────────────
const BG_LIGHT       = '#F2F5F3';   // matches app background
const CARD_WHITE     = '#FFFFFF';
const PRIMARY        = '#243628';   // deep forest green
const GREEN          = '#34A853';   // chart1 — safe
const AMBER          = '#FBBC04';   // chart2 — caution
const RED            = '#EA4335';   // chart3 — avoid
const MUTED          = '#6C7570';
const BORDER         = '#E1E6E3';
const ACCENT_BG      = '#E8F5E9';   // very light green tint

// ─── SMALL WIDGET (2×2) ───────────────────────────────
function SmallWidget({ basketScore, safeCount, reviewCount, lastUpdated }) {
    const hasData = basketScore > 0;
    const scoreColor = basketScore >= 70 ? GREEN : basketScore >= 40 ? AMBER : basketScore > 0 ? RED : MUTED;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: CARD_WHITE,
                borderRadius: 24,
                padding: 16,
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
            clickAction="OPEN_APP"
            clickActionData={{ uri: 'goodfor://' }}
        >
            {/* Header */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text="GoodFor"
                    style={{ fontSize: 15, fontWeight: '800', color: PRIMARY }}
                />
                <FlexWidget
                    style={{
                        backgroundColor: GREEN,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 10,
                    }}
                >
                    <TextWidget
                        text="PRO"
                        style={{ fontSize: 8, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Score */}
            <FlexWidget
                style={{
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text="BASKET SCORE"
                    style={{ fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 0.8 }}
                />
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 2 }}>
                    <TextWidget
                        text={hasData ? `${basketScore}` : '—'}
                        style={{ fontSize: 38, fontWeight: '800', color: scoreColor }}
                    />
                    <TextWidget
                        text="/100"
                        style={{ fontSize: 13, fontWeight: '600', color: MUTED, marginBottom: 6, marginLeft: 2 }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Scan CTA */}
            <FlexWidget
                clickAction="OPEN_SCANNER"
                clickActionData={{ uri: 'goodfor://scan' }}
                style={{
                    width: 'match_parent',
                    backgroundColor: PRIMARY,
                    borderRadius: 14,
                    paddingVertical: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TextWidget
                    text="Scan Now"
                    style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}

// ─── MEDIUM WIDGET (4×2) ──────────────────────────────
function MediumWidget({ basketScore, safeCount, reviewCount, lastUpdated }) {
    const hasData = basketScore > 0 || safeCount > 0 || reviewCount > 0;
    const scoreColor = basketScore >= 70 ? GREEN : basketScore >= 40 ? AMBER : basketScore > 0 ? RED : MUTED;

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: CARD_WHITE,
                borderRadius: 24,
                padding: 18,
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {/* Top Row: Brand + PRO */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text="GoodFor"
                    style={{ fontSize: 18, fontWeight: '800', color: PRIMARY }}
                />
                <FlexWidget
                    style={{
                        backgroundColor: GREEN,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                    }}
                >
                    <TextWidget
                        text="PRO"
                        style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}
                    />
                </FlexWidget>
            </FlexWidget>

            {/* Middle Row: Score + Stats */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: 'match_parent',
                    backgroundColor: BG_LIGHT,
                    borderRadius: 18,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                }}
            >
                {/* Left: Basket Score */}
                <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <TextWidget
                        text="BASKET SCORE"
                        style={{ fontSize: 9, fontWeight: '700', color: MUTED, letterSpacing: 0.8, marginBottom: 2 }}
                    />
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <TextWidget
                            text={hasData ? `${basketScore}` : '—'}
                            style={{ fontSize: 36, fontWeight: '800', color: scoreColor }}
                        />
                        <TextWidget
                            text="/100"
                            style={{ fontSize: 14, fontWeight: '600', color: MUTED, marginBottom: 5, marginLeft: 2 }}
                        />
                    </FlexWidget>
                </FlexWidget>

                {/* Right: Stats */}
                <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    {/* Safe */}
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextWidget
                            text={`${safeCount} Safe`}
                            style={{ fontSize: 14, fontWeight: '600', color: PRIMARY }}
                        />
                        <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN }} />
                    </FlexWidget>
                    {/* Caution */}
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TextWidget
                            text={`${reviewCount} Caution`}
                            style={{ fontSize: 14, fontWeight: '600', color: PRIMARY }}
                        />
                        <FlexWidget style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER }} />
                    </FlexWidget>
                </FlexWidget>
            </FlexWidget>

            {/* Bottom: Scan CTA */}
            <FlexWidget
                clickAction="OPEN_SCANNER"
                clickActionData={{ uri: 'goodfor://scan' }}
                style={{
                    width: 'match_parent',
                    backgroundColor: PRIMARY,
                    borderRadius: 16,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TextWidget
                    text="Scan Product"
                    style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}

// ─── LARGE WIDGET (4×4) ──────────────────────────────
function LargeWidget({ basketScore, safeCount, reviewCount, lastUpdated, recentProducts }) {
    const hasData = basketScore > 0 || safeCount > 0 || reviewCount > 0;
    const scoreColor = basketScore >= 70 ? GREEN : basketScore >= 40 ? AMBER : basketScore > 0 ? RED : MUTED;
    const products = recentProducts || [];

    return (
        <FlexWidget
            style={{
                height: 'match_parent',
                width: 'match_parent',
                backgroundColor: CARD_WHITE,
                borderRadius: 28,
                padding: 20,
                flexDirection: 'column',
                justifyContent: 'space-between',
            }}
        >
            {/* Header */}
            <FlexWidget
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: 'match_parent',
                }}
            >
                <TextWidget
                    text="GoodFor"
                    style={{ fontSize: 20, fontWeight: '800', color: PRIMARY }}
                />
                <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {lastUpdated ? (
                        <TextWidget
                            text={lastUpdated}
                            style={{ fontSize: 10, fontWeight: '500', color: MUTED }}
                        />
                    ) : null}
                    <FlexWidget
                        style={{
                            backgroundColor: GREEN,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                        }}
                    >
                        <TextWidget
                            text="PRO"
                            style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}
                        />
                    </FlexWidget>
                </FlexWidget>
            </FlexWidget>

            {/* Score Card */}
            <FlexWidget
                style={{
                    width: 'match_parent',
                    backgroundColor: BG_LIGHT,
                    borderRadius: 20,
                    padding: 18,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <TextWidget
                        text="BASKET SCORE"
                        style={{ fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.8, marginBottom: 4 }}
                    />
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <TextWidget
                            text={hasData ? `${basketScore}` : '—'}
                            style={{ fontSize: 44, fontWeight: '800', color: scoreColor }}
                        />
                        <TextWidget
                            text="/100"
                            style={{ fontSize: 16, fontWeight: '600', color: MUTED, marginBottom: 7, marginLeft: 2 }}
                        />
                    </FlexWidget>
                </FlexWidget>

                <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TextWidget text={`${safeCount} Safe`} style={{ fontSize: 15, fontWeight: '600', color: PRIMARY }} />
                        <FlexWidget style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: GREEN }} />
                    </FlexWidget>
                    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TextWidget text={`${reviewCount} Caution`} style={{ fontSize: 15, fontWeight: '600', color: PRIMARY }} />
                        <FlexWidget style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: AMBER }} />
                    </FlexWidget>
                </FlexWidget>
            </FlexWidget>

            {/* Recent Products Section */}
            <FlexWidget
                style={{
                    width: 'match_parent',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                <TextWidget
                    text="RECENT SCANS"
                    style={{ fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.8 }}
                />
                {products.length > 0 ? (
                    products.slice(0, 3).map((product, i) => (
                        <FlexWidget
                            key={`product-${i}`}
                            clickAction="OPEN_APP"
                            clickActionData={{ uri: 'goodfor://' }}
                            style={{
                                width: 'match_parent',
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: BG_LIGHT,
                                borderRadius: 14,
                                paddingHorizontal: 14,
                                paddingVertical: 10,
                                gap: 10,
                            }}
                        >
                            <FlexWidget
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: product.safety === 'safe' ? GREEN : product.safety === 'caution' ? AMBER : RED,
                                }}
                            />
                            <TextWidget
                                text={product.name || 'Unknown Product'}
                                style={{
                                    fontSize: 13,
                                    fontWeight: '600',
                                    color: PRIMARY,
                                    flex: 1,
                                }}
                                maxLines={1}
                            />
                            <TextWidget
                                text={product.safety === 'safe' ? '✓ Safe' : product.safety === 'caution' ? '⚠ Caution' : '✗ Avoid'}
                                style={{
                                    fontSize: 11,
                                    fontWeight: '700',
                                    color: product.safety === 'safe' ? GREEN : product.safety === 'caution' ? AMBER : RED,
                                }}
                            />
                        </FlexWidget>
                    ))
                ) : (
                    <FlexWidget
                        style={{
                            width: 'match_parent',
                            backgroundColor: BG_LIGHT,
                            borderRadius: 14,
                            paddingVertical: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <TextWidget
                            text="Scan products to see them here"
                            style={{ fontSize: 12, fontWeight: '500', color: MUTED }}
                        />
                    </FlexWidget>
                )}
            </FlexWidget>

            {/* Scan CTA */}
            <FlexWidget
                clickAction="OPEN_SCANNER"
                clickActionData={{ uri: 'goodfor://scan' }}
                style={{
                    width: 'match_parent',
                    backgroundColor: PRIMARY,
                    borderRadius: 18,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <TextWidget
                    text="Scan Product"
                    style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}
                />
            </FlexWidget>
        </FlexWidget>
    );
}

// ─── EXPORTED WIDGET ──────────────────────────────────
export function GoodForWidget({ widgetInfo, ...props }) {
    const width = widgetInfo?.width || 0;
    const height = widgetInfo?.height || 0;

    // Determine size variant based on widget dimensions
    // Small: ~2×2, Medium: ~4×2, Large: ~4×4
    const isSmall = width < 250 && height < 200;
    const isLarge = height > 300;

    if (isSmall) {
        return <SmallWidget {...props} />;
    }
    if (isLarge) {
        return <LargeWidget {...props} />;
    }
    return <MediumWidget {...props} />;
}

// Also export individual variants for direct use
export { SmallWidget, MediumWidget, LargeWidget };
