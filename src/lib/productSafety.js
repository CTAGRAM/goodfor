/**
 * Product Safety Analysis Engine
 * Implements age-based safety rules for food and cosmetic products
 */

// Age bracket definitions (in months for precise calculations)
const AGE_BRACKETS = {
    INFANT_PRE_WEANING: { min: 0, max: 6, label: 'Infant (0-6 months)' },
    INFANT_WEANING: { min: 6, max: 12, label: 'Infant (6-12 months)' },
    TODDLER: { min: 12, max: 36, label: 'Toddler (1-3 years)' },
    CHILD: { min: 36, max: 144, label: 'Child (4-12 years)' },
    TEEN: { min: 144, max: 216, label: 'Teen (13-18 years)' },
    ADULT: { min: 216, max: 780, label: 'Adult (18-65 years)' },
    ELDERLY: { min: 780, max: 9999, label: 'Elderly (65+ years)' },
};

// Safety severity levels
export const SAFETY_LEVELS = {
    SAFE: 'safe',
    CAUTION: 'caution',
    AVOID: 'avoid',
    CRITICAL: 'critical',
};

/**
 * Analyze product safety for specific age group
 * @param {Object} product - Parsed product from OpenFoodFacts
 * @param {number} ageMonths - User's age in months
 * @returns {Object} Safety analysis result
 */
export function analyzeProductSafety(product, ageMonths) {
    const issues = [];
    let overallSafety = SAFETY_LEVELS.SAFE;

    // Check ingredient-based restrictions
    const ingredientIssues = checkIngredientRestrictions(product, ageMonths);
    issues.push(...ingredientIssues);

    // Check nutrient thresholds
    const nutrientIssues = checkNutrientThresholds(product, ageMonths);
    issues.push(...nutrientIssues);

    // Check additive concerns
    const additiveIssues = checkAdditives(product, ageMonths);
    issues.push(...additiveIssues);

    // Determine overall safety level (worst case)
    if (issues.some(i => i.severity === SAFETY_LEVELS.CRITICAL)) {
        overallSafety = SAFETY_LEVELS.CRITICAL;
    } else if (issues.some(i => i.severity === SAFETY_LEVELS.AVOID)) {
        overallSafety = SAFETY_LEVELS.AVOID;
    } else if (issues.some(i => i.severity === SAFETY_LEVELS.CAUTION)) {
        overallSafety = SAFETY_LEVELS.CAUTION;
    }

    return {
        safety: overallSafety,
        issues,
        safeScore: calculateSafeScore(issues),
        ageAppropriate: overallSafety !== SAFETY_LEVELS.CRITICAL && overallSafety !== SAFETY_LEVELS.AVOID,
    };
}

/**
 * Check ingredient-based restrictions
 */
function checkIngredientRestrictions(product, ageMonths) {
    const issues = [];
    const ingredientsLower = product.ingredientsText.toLowerCase();

    // CRITICAL: Honey for infants
    if (ageMonths < 12 && ingredientsLower.includes('honey')) {
        issues.push({
            type: 'ingredient',
            name: 'Honey',
            severity: SAFETY_LEVELS.CRITICAL,
            reason: 'Can cause infant botulism in children under 1 year',
            ageRestriction: '< 12 months',
        });
    }

    // CRITICAL: Caffeine for children
    if (ageMonths < 216) { // < 18 years
        const caffeine = product.nutriments.caffeine;
        if (caffeine > 0) {
            const severity = ageMonths < 144 ? SAFETY_LEVELS.CRITICAL : SAFETY_LEVELS.AVOID;
            issues.push({
                type: 'nutrient',
                name: 'Caffeine',
                severity,
                reason: 'Not recommended for children and teens',
                ageRestriction: '< 18 years',
                value: `${caffeine.toFixed(1)} mg/100g`,
            });
        }
    }

    // Check for common allergens if present
    if (product.allergens.length > 0) {
        issues.push({
            type: 'allergen',
            name: 'Contains Allergens',
            severity: SAFETY_LEVELS.CAUTION,
            reason: `Contains: ${product.allergens.map(a => a.replace('en:', '')).join(', ')}`,
            allergens: product.allergens,
        });
    }

    return issues;
}

/**
 * Check nutrient thresholds by age group
 */
function checkNutrientThresholds(product, ageMonths) {
    const issues = [];

    // Sodium thresholds (mg per 100g)
    const sodiumLimits = {
        [AGE_BRACKETS.TODDLER.min]: 300, // ~25% of 1200mg daily limit
        [AGE_BRACKETS.CHILD.min]: 375,   // ~25% of 1500mg daily limit
        [AGE_BRACKETS.TEEN.min]: 450,    // ~25% of 1800mg daily limit
    };

    const sodiumMg = product.nutriments.sodium * 1000; // Convert g to mg
    const limit = Object.entries(sodiumLimits)
        .reverse()
        .find(([minAge]) => ageMonths >= parseInt(minAge))?.[1];

    if (limit && sodiumMg > limit) {
        issues.push({
            type: 'nutrient',
            name: 'High Sodium',
            severity: SAFETY_LEVELS.CAUTION,
            reason: `Contains ${sodiumMg.toFixed(0)}mg sodium per 100g (limit: ${limit}mg)`,
            value: `${sodiumMg.toFixed(0)} mg/100g`,
        });
    }

    // Sugar thresholds (g per 100g)
    const sugarLimit = ageMonths < 216 ? 6.25 : 12.5; // <18y: 25g/day, adults: 50g/day
    if (product.nutriments.sugars > sugarLimit) {
        const severity = product.nutriments.sugars > sugarLimit * 2 ? SAFETY_LEVELS.AVOID : SAFETY_LEVELS.CAUTION;
        issues.push({
            type: 'nutrient',
            name: 'High Sugar',
            severity,
            reason: `High sugar content: ${product.nutriments.sugars.toFixed(1)}g per 100g`,
            value: `${product.nutriments.sugars.toFixed(1)} g/100g`,
        });
    }

    return issues;
}

/**
 * Check concerning additives
 */
function checkAdditives(product, ageMonths) {
    const issues = [];

    // Concerning additives for children
    const concerningAdditives = {
        'en:e102': 'Tartrazine (Yellow 5) - May cause hyperactivity',
        'en:e110': 'Sunset Yellow - May cause hyperactivity',
        'en:e129': 'Allura Red - May cause hyperactivity',
        'en:e621': 'MSG - Some children may be sensitive',
        'en:e951': 'Aspartame - Not recommended for young children',
    };

    product.additives.forEach(additive => {
        if (concerningAdditives[additive] && ageMonths < 144) { // < 12 years
            issues.push({
                type: 'additive',
                name: additive.replace('en:', '').toUpperCase(),
                severity: SAFETY_LEVELS.CAUTION,
                reason: concerningAdditives[additive],
            });
        }
    });

    return issues;
}

/**
 * Calculate overall safety score (0-100)
 */
function calculateSafeScore(issues) {
    let score = 100;

    issues.forEach(issue => {
        switch (issue.severity) {
            case SAFETY_LEVELS.CRITICAL:
                score -= 50;
                break;
            case SAFETY_LEVELS.AVOID:
                score -= 30;
                break;
            case SAFETY_LEVELS.CAUTION:
                score -= 15;
                break;
        }
    });

    return Math.max(0, score);
}

/**
 * Get age group label from months
 */
export function getAgeGroupLabel(ageMonths) {
    for (const bracket of Object.values(AGE_BRACKETS)) {
        if (ageMonths >= bracket.min && ageMonths < bracket.max) {
            return bracket.label;
        }
    }
    return 'Adult';
}

/**
 * Convert age in years to months
 */
export function yearsToMonths(years) {
    return years * 12;
}

export default {
    analyzeProductSafety,
    SAFETY_LEVELS,
    getAgeGroupLabel,
    yearsToMonths,
};
