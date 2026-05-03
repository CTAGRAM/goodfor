/**
 * Cosmetic Safety Analysis Engine - Enhanced v2.0
 * 
 * Implements age-based safety rules and multi-dimensional scoring for beauty products.
 * Features:
 * - 5-Pillar Scoring (Toxicity, Sensitization, Endocrine, Environment, Data Quality)
 * - INCI Position-based Concentration Weighting
 * - Personalization Engine (Allergies, Skin Type, Pregnancy)
 * - Efficacy Balance (Bonus for proven actives)
 * 
 * Based on EU Regulation 1223/2009, FDA guidance, and scientific literature.
 */

import { checkFragranceAllergens, checkGenericFragrance } from '@/data/fragranceAllergens';
import {
    RISK_LEVELS,
    CONCERN_CATEGORIES,
    POSITION_MULTIPLIERS,
    PRODUCT_TYPE_MODIFIERS,
    EFFICACY_INGREDIENTS,
    COSMETIC_INGREDIENTS,
    getCosmeticIngredientInfo
} from '@/data/cosmeticIngredients';

// Simple severity levels for use in code
const SEVERITY = {
    CRITICAL: 'CRITICAL',
    AVOID: 'AVOID',
    CAUTION: 'CAUTION',
    SAFE: 'SAFE',
};

// Compatibility alias for UI components
export const COSMETIC_SAFETY_LEVELS = {
    SAFE: 'SAFE',
    CAUTION: 'CAUTION',
    AVOID: 'AVOID',
    CRITICAL: 'CRITICAL',
};

/**
 * Age-specific cosmetic ingredient restrictions
 */
const INFANT_RESTRICTIONS = [
    {
        patterns: [/parfum/i, /fragrance/i, /aroma/i, /perfume/i],
        severity: SEVERITY.CRITICAL || 'CRITICAL', // Fallback if undefined
        reason: 'Synthetic fragrances can cause skin sensitization and allergic reactions in infants',
        ageMax: 12, // months
    },
    {
        patterns: [/eucalyptus/i, /rosemary/i, /peppermint/i, /camphor/i, /1,8-cineole/i, /eucalyptol/i],
        severity: SEVERITY.CRITICAL || 'CRITICAL',
        reason: 'Contains 1,8-cineole which can cause breathing difficulties in infants',
        ageMax: 36, // months
    },
    {
        patterns: [/methylparaben/i, /propylparaben/i, /butylparaben/i, /ethylparaben/i, /paraben/i],
        severity: SEVERITY.CAUTION || 'CAUTION',
        reason: 'Precautionary - some parabens restricted in EU baby products',
        ageMax: 36,
    },
    {
        patterns: [/sodium lauryl sulfate/i, /sodium laureth sulfate/i, /\bsls\b/i, /\bsles\b/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Strong surfactant - can irritate and dry delicate infant skin',
        ageMax: 36,
    },
    {
        patterns: [/\btalc\b/i, /talcum/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Respiratory inhalation risk and potential asbestos contamination concerns',
        ageMax: 36,
    }
];

/**
 * General restrictions that apply to ALL ages
 */
const GENERAL_RESTRICTIONS = [
    {
        patterns: [/formaldehyde/i, /formalin/i],
        severity: SEVERITY.CRITICAL || 'CRITICAL',
        reason: 'Known human carcinogen (IARC Group 1) - banned in EU cosmetics',
        pillar: 'toxicity'
    },
    {
        patterns: [/dmdm hydantoin/i, /imidazolidinyl urea/i, /quaternium-15/i, /bronopol/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Formaldehyde-releasing preservative - may cause sensitization',
        pillar: 'sensitization'
    },
    {
        patterns: [/propylparaben/i, /butylparaben/i],
        severity: SEVERITY.CAUTION || 'CAUTION',
        reason: 'Potential estrogenic activity - restricted in EU',
        pillar: 'endocrine'
    },
    {
        patterns: [/sodium lauryl sulfate/i, /\bsls\b/i],
        severity: SEVERITY.CAUTION || 'CAUTION',
        reason: 'Can be drying and irritating to sensitive skin',
        pillar: 'sensitization'
    },
    {
        patterns: [/oxybenzone/i, /benzophenone-3/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Potential hormone disruption and coral reef damage',
        pillar: 'endocrine'
    },
    {
        patterns: [/triclosan/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Endocrine disruptor - banned in antibacterial soaps',
        pillar: 'endocrine'
    },
    {
        patterns: [/hydroquinone/i],
        severity: SEVERITY.CRITICAL || 'CRITICAL',
        reason: 'Banned in EU (except prescription) - ochronosis risk',
        pillar: 'toxicity'
    },
    {
        patterns: [/dibutyl phthalate/i, /\bdbp\b/i, /diethylhexyl phthalate/i, /\bdehp\b/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'Endocrine disrupting chemicals - reproductive toxicity',
        pillar: 'endocrine'
    }
];

/**
 * Pregnancy-specific restrictions
 */
const PREGNANCY_RESTRICTIONS = [
    {
        patterns: [/\bretinol\b/i, /retinyl/i, /retinoic/i, /tretinoin/i, /adapalene/i, /tazarotene/i, /retinal\b/i],
        severity: SEVERITY.CRITICAL || 'CRITICAL',
        reason: 'Retinoids linked to birth defects - AVOID during pregnancy',
        pillar: 'toxicity'
    },
    {
        patterns: [/salicylic acid/i, /beta hydroxy/i, /\bbha\b/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'High-dose salicylic acid (>2%) not recommended during pregnancy',
        pillar: 'toxicity'
    },
    {
        patterns: [/hydroquinone/i],
        severity: SEVERITY.AVOID || 'AVOID',
        reason: 'High systemic absorption rate - avoid during pregnancy',
        pillar: 'toxicity'
    },
    {
        patterns: [/oxybenzone/i, /benzophenone-3/i, /octinoxate/i],
        severity: SEVERITY.CAUTION || 'CAUTION',
        reason: 'Chemical UV filters may have endocrine effects',
        pillar: 'endocrine'
    }
];

/**
 * Main cosmetic safety analysis function
 */
export function analyzeCosmeticSafety(product, userPreferences = {}) {
    console.log('[CosmeticSafety] ✓ Starting cosmetic analysis for:', product?.name);
    console.log('[CosmeticSafety] Personalization data:', {
        skinType: userPreferences?.skinType || userPreferences?.skin_type,
        skinConditions: userPreferences?.skinConditions || userPreferences?.skin_conditions,
        cosmeticAllergens: userPreferences?.cosmeticAllergens || userPreferences?.cosmetic_allergens,
        isPregnant: userPreferences?.isPregnant || userPreferences?.is_pregnant,
    });

    const issues = [];
    const ageMonths = userPreferences?.ageMonths || 216; // Default to adult (18 years)
    const isPregnant = userPreferences?.isPregnant || userPreferences?.is_pregnant || false;
    const isBreastfeeding = userPreferences?.isBreastfeeding || userPreferences?.is_breastfeeding || false;

    // Get ingredients list
    const ingredients = product.ingredients || [];
    // Normalize string ingredients
    const normalizedIngredients = ingredients.map(ing =>
        (typeof ing === 'string' ? ing : ing.normalized || ing.name || ing.raw || '').toLowerCase()
    );

    // 1. Check infant restrictions (<36 months)
    if (ageMonths < 36) {
        for (const restriction of INFANT_RESTRICTIONS) {
            if (restriction.ageMax && ageMonths > restriction.ageMax) continue;

            for (const pattern of restriction.patterns) {
                // Find matching ingredients with their index (position)
                normalizedIngredients.forEach((ing, index) => {
                    if (pattern.test(ing)) {
                        issues.push({
                            name: ing.toUpperCase(),
                            severity: restriction.severity,
                            reason: restriction.reason,
                            type: 'AGE_RESTRICTION',
                            pillar: restriction.pillar || 'toxicity',
                            position: index + 1 // 1-based INCI position
                        });
                    }
                });
            }
        }
    }

    // 2. Check pregnancy restrictions
    if (isPregnant || isBreastfeeding) {
        for (const restriction of PREGNANCY_RESTRICTIONS) {
            for (const pattern of restriction.patterns) {
                normalizedIngredients.forEach((ing, index) => {
                    if (pattern.test(ing)) {
                        issues.push({
                            name: ing.toUpperCase(),
                            severity: restriction.severity,
                            reason: restriction.reason + (isBreastfeeding ? ' (also avoid while breastfeeding)' : ''),
                            type: 'PREGNANCY_RESTRICTION',
                            pillar: restriction.pillar || 'toxicity',
                            position: index + 1
                        });
                    }
                });
            }
        }
    }

    // 3. Check general ingredient restrictions (Hardcoded patterns)
    for (const restriction of GENERAL_RESTRICTIONS) {
        for (const pattern of restriction.patterns) {
            normalizedIngredients.forEach((ing, index) => {
                if (pattern.test(ing)) {
                    if (!issues.some(i => i.name === ing.toUpperCase() && i.reason === restriction.reason)) {
                        issues.push({
                            name: ing.toUpperCase(),
                            severity: restriction.severity,
                            reason: restriction.reason,
                            type: 'INGREDIENT_CONCERN',
                            pillar: restriction.pillar || 'toxicity',
                            position: index + 1
                        });
                    }
                }
            });
        }
    }

    // 3b. Check comprehensive Ingredient Database (COSMETIC_INGREDIENTS)
    // Each ingredient is looked up in the database. Known-risky ingredients get
    // severity-based penalties. Unknown ingredients get a moderate penalty since
    // we can't confirm their safety — this prevents inflated scores.
    let unknownIngredientCount = 0;
    const knownSafePatterns = [
        /\bwater\b/i, /\baqua\b/i, /\beau\b/i,
        /glycerin/i, /glycerol/i,
        /\btocopherol\b/i, /\bvitamin e\b/i,
        /panthenol/i, /\bprovitamin b5\b/i,
        /allantoin/i,
        /\bsqualane\b/i, /\bsqualene\b/i,
        /\burea\b/i,
        /\bxanthan gum\b/i,
        /\bcarbomer\b/i,
        /\bcitric acid\b/i,
        /\bsodium chloride\b/i,
        /\bpotassium sorbate\b/i,
        /\bsodium benzoate\b/i,
        /\bcaprylyl glycol\b/i,
        /\bethylhexylglycerin\b/i,
        /\bsorbitol\b/i,
        /\bpropylene glycol\b/i,
        /\bbutylene glycol\b/i,
        /\bsodium hydroxide\b/i,
        /\bstearic acid\b/i,
        /\bpalmitic acid\b/i,
        /\bmyristic acid\b/i,
        /\boleic acid\b/i,
        /\blinoleic acid\b/i,
        /\bcaprylic.?capric triglyceride\b/i,
        /\bisopropyl myristate\b/i,
        /\bpolyethylene glycol\b/i, /\bpeg-/i,
        /\bpolysorbate/i,
        /\bglyceryl stearate\b/i,
        /\bceteareth-\d+/i,
        /\bsteareth-\d+/i,
        /\bpoloxamer/i,
        /\bhydrogenated\b.*\boil\b/i,
        /\bbehenyl alcohol\b/i,
        /\bmyristyl alcohol\b/i,
        /\boleyl alcohol\b/i,
        /\barachidyl alcohol\b/i,
        /\bchlorhexidine\b/i,
        /\bmenthol\b/i,
        /\bcamphor\b/i,
    ];

    for (let i = 0; i < normalizedIngredients.length; i++) {
        const ing = normalizedIngredients[i];
        if (!ing || ing.length < 2) continue;

        // Skip if already flagged by hardcoded restrictions above
        if (issues.some(iss => iss.name === ing.toUpperCase())) continue;

        // Look up in COSMETIC_INGREDIENTS database
        const dbEntry = getCosmeticIngredientInfo(ing);

        if (dbEntry) {
            // Found in database — apply severity-based penalty if not SAFE
            if (dbEntry.safetyLevel && dbEntry.safetyLevel !== 'SAFE') {
                const severity = dbEntry.safetyLevel; // 'CAUTION', 'AVOID', 'CRITICAL'
                const reason = dbEntry.concerns && dbEntry.concerns.length > 0
                    ? dbEntry.concerns[0]
                    : `${dbEntry.category || 'Ingredient'} — ${severity.toLowerCase()} risk`;

                // Map safetyLevel to pillar
                let pillar = 'toxicity';
                const lowerConcerns = (dbEntry.concerns || []).join(' ').toLowerCase();
                if (lowerConcerns.includes('endocrine') || lowerConcerns.includes('hormone') || lowerConcerns.includes('estrogenic')) {
                    pillar = 'endocrine';
                } else if (lowerConcerns.includes('sensitiz') || lowerConcerns.includes('allergi') || lowerConcerns.includes('irritat')) {
                    pillar = 'sensitization';
                } else if (lowerConcerns.includes('environment') || lowerConcerns.includes('coral') || lowerConcerns.includes('biodegradable')) {
                    pillar = 'environment';
                }

                issues.push({
                    name: (dbEntry.inci || ing).toUpperCase(),
                    severity,
                    reason,
                    type: 'DATABASE_MATCH',
                    pillar,
                    position: i + 1
                });
            }
            // If SAFE, no penalty — this is expected
        } else {
            // Not in database — check if it's a known-safe common ingredient
            const isKnownSafe = knownSafePatterns.some(p => p.test(ing));

            if (!isKnownSafe) {
                unknownIngredientCount++;
            }
        }
    }

    // Apply penalty for unknown/unrecognized ingredients
    // Each unknown ingredient = moderate penalty since we can't confirm safety
    if (unknownIngredientCount > 0) {
        const unknownPenaltyPerIngredient = 5;
        const maxUnknownPenalty = 50; // Cap total unknown penalty
        const totalUnknownPenalty = Math.min(unknownIngredientCount * unknownPenaltyPerIngredient, maxUnknownPenalty);

        issues.push({
            name: `${unknownIngredientCount} UNRECOGNIZED INGREDIENTS`,
            severity: unknownIngredientCount > 3 ? 'CAUTION' : 'LOW_RISK',
            reason: `${unknownIngredientCount} ingredient(s) not in our safety database — safety unconfirmed`,
            type: 'UNKNOWN_INGREDIENT',
            pillar: 'dataQuality',
            position: normalizedIngredients.length,
            unknownPenalty: totalUnknownPenalty // Custom property for scoring
        });
    }

    // 4. Check EU fragrance allergens
    const fragranceAllergens = checkFragranceAllergens(ingredients, ageMonths);
    issues.push(...fragranceAllergens.map((a, index) => ({
        name: a.name,
        severity: a.severity,
        reason: a.reason,
        type: 'FRAGRANCE_ALLERGEN',
        pillar: 'sensitization',
        isBanned: a.isBanned,
        position: a.position || (ingredients.length), // Fallback if position unknown
        isAfterFragrance: a.isAfterFragrance
    })));

    // 5. Check generic fragrance for babies
    const genericFragrance = checkGenericFragrance(ingredients, ageMonths);
    issues.push(...genericFragrance.map(a => ({
        ...a,
        type: 'FRAGRANCE',
        pillar: 'sensitization',
    })));

    // Calculate overall safety level string (for legacy/summary compatibility)
    const overallSafety = calculateOverallSafety(issues);

    // Calculate ENHANCED 5-pillar score
    const scoreResult = calculateCosmeticSafeScore(issues, product, userPreferences);

    const result = {
        safety: overallSafety,
        issues,
        safeScore: scoreResult.score,
        pillars: scoreResult.pillars,
        personalConcerns: scoreResult.personalConcerns || [],
        productType: 'BEAUTY',
        productSubtype: product.productSubtype,
        ageAppropriate: overallSafety !== COSMETIC_SAFETY_LEVELS.CRITICAL && overallSafety !== COSMETIC_SAFETY_LEVELS.AVOID,

        // Metadata
        hasFragranceAllergens: fragranceAllergens.length > 0,
        fragranceAllergenCount: fragranceAllergens.length,
        hasBannedIngredients: issues.some(i => i.isBanned),
        isCrueltyFree: product.isCrueltyFree || false,
        isVegan: product.isVegan || false,
    };

    console.log('[CosmeticSafety] ✓ Analysis complete:', {
        score: result.safeScore,
        safety: result.safety,
        issuesCount: result.issues.length,
        personalConcernsCount: result.personalConcerns.length,
        pillars: result.pillars
    });

    return result;
}

/**
 * Enhanced Cosmetic Safety Score (5-Pillar System)
 */
function calculateCosmeticSafeScore(issues, product, userPreferences = {}) {
    // 1. Initialize pillars with perfect scores
    const pillars = {
        toxicity: 25,
        sensitization: 25,
        endocrine: 25,
        environment: 15,
        dataQuality: 10
    };

    // 2. Assess Data Quality first (bonus/penalty base)
    const ingredientsCount = (product.ingredients || []).length;
    if (ingredientsCount < 3) pillars.dataQuality = 2; // Very poor data
    else if (ingredientsCount < 5) pillars.dataQuality = 5;
    else pillars.dataQuality = 10; // Good data availability

    // 3. Apply Penalties based on Issues + Logic

    for (const issue of issues) {
        // Handle UNKNOWN_INGREDIENT specially — uses custom penalty amount
        if (issue.type === 'UNKNOWN_INGREDIENT' && issue.unknownPenalty) {
            // Split unknown penalty: 60% to dataQuality, 40% to toxicity (we can't confirm safety)
            const dqPenalty = issue.unknownPenalty * 0.6;
            const toxPenalty = issue.unknownPenalty * 0.4;
            pillars.dataQuality = Math.max(0, pillars.dataQuality - dqPenalty);
            pillars.toxicity = Math.max(0, pillars.toxicity - toxPenalty);
            continue;
        }

        const pillarKey = issue.pillar || mapTypeToPillar(issue.type);
        if (!pillars[pillarKey]) continue;

        // Base Penalty
        const basePenalty = getBasePenalty(issue.severity);

        // Concentration Multiplier (INCI Position)
        // Default position multiplier is 1.0. 
        // If position is low (top of list), multiplier > 1.0
        // If position is high (bottom), multiplier < 1.0
        const multiplier = issue.position ? getPositionMultiplier(issue.position, issue.isAfterFragrance) : 1.0;

        const adjustedPenalty = basePenalty * multiplier;

        // Apply penalty to pillar (clamp at 0)
        pillars[pillarKey] = Math.max(0, pillars[pillarKey] - adjustedPenalty);
    }

    // 4. Calculate Base Score
    let baseScore = Object.values(pillars).reduce((a, b) => a + b, 0);

    // 5. Apply Personalization (Phase 3)
    const personalized = applyPersonalization(baseScore, issues, product, userPreferences);
    let finalScore = personalized.score;
    const personalConcerns = personalized.personalConcerns;

    // 6. Apply Efficacy Bonus (Phase 4 - for adults)
    const isAdult = (userPreferences?.ageMonths || 216) >= 192; // 16+
    const isPregnant = userPreferences?.isPregnant || false;

    if (isAdult && !isPregnant) {
        finalScore = applyEfficacyBalance(finalScore, product, userPreferences);
    }

    // 7. Hard Caps by worst severity found
    if (issues.some(i => i.isBanned || i.severity === 'CRITICAL' || i.severity === SEVERITY.CRITICAL)) {
        finalScore = Math.min(finalScore, 10);
    } else if (issues.some(i => i.severity === 'AVOID' || i.severity === SEVERITY.AVOID)) {
        finalScore = Math.min(finalScore, 35);
    } else if (issues.filter(i => i.severity === 'CAUTION' || i.severity === SEVERITY.CAUTION).length >= 2) {
        // Multiple CAUTION ingredients should still drag score down meaningfully
        finalScore = Math.min(finalScore, 65);
    }

    return {
        score: Math.round(Math.max(0, Math.min(100, finalScore))),
        pillars,
        personalConcerns
    };
}

/**
 * Helper: Map legacy/generic types to 5 pillars
 */
function mapTypeToPillar(type) {
    const mapping = {
        'AGE_RESTRICTION': 'toxicity',
        'PREGNANCY_RESTRICTION': 'toxicity',
        'INGREDIENT_CONCERN': 'toxicity', // Default
        'DATABASE_MATCH': 'toxicity', // From COSMETIC_INGREDIENTS DB
        'UNKNOWN_INGREDIENT': 'dataQuality', // Unknown ingredients
        'FRAGRANCE_ALLERGEN': 'sensitization',
        'FRAGRANCE': 'sensitization',
        'SUNSCREEN_FILTER': 'endocrine',
        'HEALTH_CONDITION': 'toxicity',
        'PERSONAL_ALLERGEN': 'sensitization' // Though usually handled separately
    };
    return mapping[type] || 'toxicity';
}

/**
 * Helper: Base penalty points by severity
 */
function getBasePenalty(severity) {
    // Calibrated penalties aligned with EWG/Yuka-style scoring
    if (severity === 'CRITICAL' || severity === 'BANNED' || severity === SEVERITY.CRITICAL) return 25;
    if (severity === 'AVOID' || severity === 'HIGH_RISK' || severity === SEVERITY.AVOID) return 18;
    if (severity === 'CAUTION' || severity === 'MODERATE_RISK' || severity === SEVERITY.CAUTION) return 10;
    if (severity === 'LOW_RISK' || severity === SEVERITY.SAFE) return 4;
    return 0;
}

/**
 * Helper: INCI Position Multiplier
 */
function getPositionMultiplier(position, isAfterFragrance = false) {
    if (isAfterFragrance) return 0.4;  // Trace amount — still penalize
    if (position <= 2) return 2.0;     // Primary ingredients — heavy penalty
    if (position <= 5) return 1.6;     // High concentration
    if (position <= 10) return 1.2;    // Standard — still meaningful
    if (position <= 20) return 0.9;    // Low — still counts
    return 0.6;                        // Trace/adjusters — not negligible
}

/**
 * Helper: Personalization Engine
 */
function applyPersonalization(score, issues, product, prefs) {
    let adjustedScore = score;
    const personalConcerns = [];
    const userAllergens = prefs?.cosmetic_allergens || prefs?.cosmeticAllergens || [];
    const skinType = prefs?.skin_type || prefs?.skinType || 'normal';

    // 1. Personal Allergens
    if (userAllergens.length > 0 && product.ingredientsText) {
        const text = product.ingredientsText.toLowerCase();
        userAllergens.forEach(allergen => {
            if (text.includes(allergen.toLowerCase())) {
                adjustedScore -= 25; // Huge penalty
                personalConcerns.push({
                    type: 'PERSONAL_ALLERGEN',
                    name: allergen.toUpperCase(),
                    severity: 'CRITICAL',
                    reason: `Contains your allergen: ${allergen}`,
                    isPersonal: true
                });
            }
        });
    }

    // 2. Sensitive Skin
    if (skinType === 'sensitive') {
        const sensitizers = issues.filter(i =>
            i.pillar === 'sensitization' ||
            i.type === 'FRAGRANCE' ||
            i.reason?.toLowerCase().includes('irritat')
        );
        if (sensitizers.length > 0) {
            adjustedScore -= (sensitizers.length * 4);
            personalConcerns.push({
                type: 'SENSITIVE_SKIN',
                name: 'Sensitive Skin Warning',
                severity: 'CAUTION',
                reason: `Contains ${sensitizers.length} potential irritants for sensitive skin`,
                isPersonal: true
            });
        }
    }

    return { score: adjustedScore, personalConcerns };
}

/**
 * Helper: Efficacy Balance (Bonus for Actives)
 */
function applyEfficacyBalance(score, product, prefs) {
    if (!product.ingredientsText) return score;
    let bonus = 0;
    const text = product.ingredientsText.toLowerCase();

    // Check for proven actives
    // Check for proven actives
    if (EFFICACY_INGREDIENTS) {
        Object.keys(EFFICACY_INGREDIENTS).forEach(inci => {
            if (text.includes(inci.toLowerCase())) {
                const data = EFFICACY_INGREDIENTS[inci];
                bonus += data.efficacyBonus || 3;

                // Add condition-specific bonuses
                if (data.conditionBonus && prefs?.skinConditions) {
                    for (const condition of prefs.skinConditions) {
                        if (data.conditionBonus[condition]) {
                            bonus += data.conditionBonus[condition];
                        }
                    }
                }
            }
        });
    }

    return Math.min(100, score + Math.min(8, bonus)); // Cap bonus at 8 to avoid inflating problematic products
}

/**
 * Calculate legacy safety string
 */
function calculateOverallSafety(issues) {
    if (issues.some(i => i.severity === 'CRITICAL' || i.severity === 'BANNED' || i.severity === SEVERITY.CRITICAL)) return 'CRITICAL';
    if (issues.some(i => i.severity === 'AVOID' || i.severity === 'HIGH_RISK' || i.severity === SEVERITY.AVOID)) return 'AVOID';
    if (issues.some(i => i.severity === 'CAUTION' || i.severity === 'MODERATE_RISK' || i.severity === SEVERITY.CAUTION)) return 'CAUTION';
    return 'SAFE';
}

// Re-export specific helpers if needed elsewhere
export function getPillarBreakdown(product, userPreferences = {}) {
    const analysis = analyzeCosmeticSafety(product, userPreferences);
    return {
        overall: analysis.safeScore,
        pillars: analysis.pillars,
        issues: analysis.issues
    };
}
