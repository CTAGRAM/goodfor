/**
 * Product Safety Analysis Engine
 * Implements age-based safety rules for food and cosmetic products
 */

import { analyzeIngredientOrigins, calculateSyntheticPenalty } from './ingredientClassifier';
import { checkHealthConditionTriggers, calculateHealthConditionPenalty } from './healthConditions';

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
 * Analyze product safety for specific age group and user preferences
 * @param {Object} product - Parsed product from OpenFoodFacts
 * @param {number} ageMonths - User's age in months
 * @param {Object} userPreferences - User's personal allergies and dietary restrictions
 * @returns {Object} Safety analysis result
 */
export function analyzeProductSafety(product, ageMonths, userPreferences = {}) {
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

    // NEW: Check user's personal allergies against product allergens
    const personalAllergenIssues = checkPersonalAllergens(product, userPreferences.allergies || []);
    issues.push(...personalAllergenIssues);

    // NEW: Check dietary restrictions
    const dietaryIssues = checkDietaryRestrictions(product, userPreferences.dietaryRestrictions || []);
    issues.push(...dietaryIssues);

    // Determine overall safety level (worst case)
    if (issues.some(i => i.severity === SAFETY_LEVELS.CRITICAL)) {
        overallSafety = SAFETY_LEVELS.CRITICAL;
    } else if (issues.some(i => i.severity === SAFETY_LEVELS.AVOID)) {
        overallSafety = SAFETY_LEVELS.AVOID;
    } else if (issues.some(i => i.severity === SAFETY_LEVELS.CAUTION)) {
        overallSafety = SAFETY_LEVELS.CAUTION;
    }

    // Calculate Nutri-Score with breakdown
    const nutriScore = calculateNutriScore(product.nutriments || {});
    const nutriGrade = getNutriScoreGrade(nutriScore.rawScore);

    // NEW: Get Eco-Score info
    const ecoScoreInfo = getEcoScoreInfo(product.ecoScore);

    // NEW: Get NOVA group info
    const novaInfo = getNovaInfo(product.novaGroup);

    // NEW: Analyze ingredient origins (natural vs synthetic)
    const ingredientOrigins = analyzeIngredientOrigins(product.additives || []);

    // NEW: Check health condition triggers
    const healthConditionTriggers = userPreferences?.healthConditions
        ? checkHealthConditionTriggers(product.additives || [], userPreferences.healthConditions)
        : [];

    // Add health condition issues to main issues list
    healthConditionTriggers.forEach(trigger => {
        issues.push({
            name: `${trigger.conditionName}: ${trigger.ingredientName}`,
            severity: trigger.severity,
            reason: trigger.reason,
            type: 'HEALTH_CONDITION',
        });
    });

    return {
        safety: overallSafety,
        issues,
        safeScore: calculateSafeScore(
            issues,
            product.nutriments || {},
            ecoScoreInfo,
            novaInfo,
            ingredientOrigins,
            healthConditionTriggers
        ),
        ageAppropriate: overallSafety !== SAFETY_LEVELS.CRITICAL && overallSafety !== SAFETY_LEVELS.AVOID,
        ageGroup: getAgeGroupLabel(ageMonths),
        // Nutri-Score data for UI display
        nutriScore: {
            rawScore: nutriScore.rawScore,
            grade: nutriGrade.grade,
            gradeColor: nutriGrade.color,
            breakdown: nutriScore.breakdown,
        },
        // NEW: Environmental impact
        ecoScore: ecoScoreInfo,
        // NEW: Processing level
        novaGroup: novaInfo,
        // NEW: Personal matches
        hasPersonalAllergenMatch: personalAllergenIssues.length > 0,
        matchedAllergens: personalAllergenIssues.map(i => i.name),
        // NEW: Ingredient origin analysis
        ingredientOrigins,
        // NEW: Health condition triggers
        healthConditionTriggers,
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
 * Check user's personal allergies against product allergens
 * @param {Object} product - Parsed product
 * @param {Array} userAllergies - User's listed allergies
 */
function checkPersonalAllergens(product, userAllergies = []) {
    const issues = [];
    if (!userAllergies.length || !product.allergens?.length) return issues;

    // Normalize product allergens (e.g., "en:milk" -> "milk")
    const productAllergens = product.allergens.map(a =>
        a.replace('en:', '').toLowerCase().replace(/-/g, ' ')
    );

    // Common allergen name mappings
    const allergenMap = {
        'dairy': ['milk', 'lactose', 'casein', 'whey'],
        'tree nuts': ['almonds', 'cashews', 'walnuts', 'hazelnuts', 'pistachios', 'pecans'],
        'shellfish': ['shrimp', 'crab', 'lobster', 'prawns'],
        'fish': ['salmon', 'tuna', 'cod', 'anchovy'],
    };

    userAllergies.forEach(userAllergy => {
        const allergyLower = userAllergy.toLowerCase();

        // Check direct match
        let matched = productAllergens.some(pa =>
            pa.includes(allergyLower) || allergyLower.includes(pa)
        );

        // Check mapped allergens (e.g., "dairy" matches "milk")
        if (!matched && allergenMap[allergyLower]) {
            matched = allergenMap[allergyLower].some(mapped =>
                productAllergens.some(pa => pa.includes(mapped))
            );
        }

        if (matched) {
            issues.push({
                type: 'personal_allergen',
                name: userAllergy,
                severity: SAFETY_LEVELS.CRITICAL,
                reason: `Contains ${userAllergy} - you indicated you are allergic`,
                isPersonal: true,
            });
        }
    });

    return issues;
}

/**
 * Check dietary restrictions against product
 * @param {Object} product - Parsed product
 * @param {Array} restrictions - User's dietary restrictions
 */
function checkDietaryRestrictions(product, restrictions = []) {
    const issues = [];
    if (!restrictions.length) return issues;

    const ingredientsLower = (product.ingredientsText || '').toLowerCase();
    // Also check product name and categories for meat-type products
    const productNameLower = (product.name || '').toLowerCase();
    const categoriesLower = (product.categories || []).map(c => c.toLowerCase()).join(' ');
    const fullText = `${ingredientsLower} ${productNameLower} ${categoriesLower}`;

    const dietaryChecks = {
        'vegetarian': {
            forbidden: ['gelatin', 'meat', 'chicken', 'beef', 'pork', 'fish', 'anchovy', 'lard', 'tallow', 'rennet', 'collagen', 'bone',
                'liver', 'offal', 'pate', 'pâté', 'brawn', 'tripe', 'blood pudding', 'black pudding', 'dripping'],
            severity: SAFETY_LEVELS.AVOID,
            reason: 'Contains non-vegetarian ingredients',
        },
        'vegan': {
            forbidden: ['milk', 'egg', 'honey', 'gelatin', 'meat', 'fish', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lard', 'tallow', 'beeswax', 'shellac', 'carmine', 'lanolin', 'collagen',
                'liver', 'offal', 'pate', 'pâté', 'brawn', 'tripe', 'blood pudding', 'black pudding', 'dripping'],
            severity: SAFETY_LEVELS.AVOID,
            reason: 'Contains animal-derived ingredients',
        },
        'halal': {
            forbidden: [
                'pork', 'lard', 'gelatin', 'alcohol', 'wine', 'beer', 'rum', 'ethanol',
                'bacon', 'ham', 'sausage', 'pepperoni', 'chorizo', 'salami', 'prosciutto',
                'pancetta', 'mortadella', 'sopressata', 'bratwurst',
                'pig', 'swine', 'boar',
                'rennet', 'collagen', 'carmine', 'cochineal',
                'e120', 'e441', 'e542', 'e904',
                // Pork-derived products often not explicitly labelled as pork
                'pate', 'pâté', 'liver', 'offal', 'blood', 'black pudding',
                'brawn', 'head cheese', 'tripe', 'crackling', 'rind', 'dripping',
                'liverwurst', 'leberwurst', 'terrine',
            ],
            severity: SAFETY_LEVELS.CRITICAL,
            reason: 'Contains non-halal ingredients — not suitable for halal diet',
        },
        'kosher': {
            forbidden: ['pork', 'shellfish', 'shrimp', 'crab', 'lobster', 'lard', 'bacon', 'ham', 'sausage',
                'pate', 'pâté', 'liver', 'offal', 'blood pudding', 'black pudding'],
            severity: SAFETY_LEVELS.AVOID,
            reason: 'May contain non-kosher ingredients',
        },
        'gluten-free': {
            forbidden: ['wheat', 'barley', 'rye', 'oats', 'gluten'],
            severity: SAFETY_LEVELS.AVOID,
            reason: 'Contains gluten',
        },
        'lactose-free': {
            forbidden: ['milk', 'lactose', 'cream', 'cheese', 'butter', 'whey'],
            severity: SAFETY_LEVELS.AVOID,
            reason: 'Contains lactose/dairy',
        },
    };

    restrictions.forEach(restriction => {
        // Case-insensitive lookup (profile stores 'Halal', checks key is 'halal')
        const check = dietaryChecks[restriction.toLowerCase()];
        if (check) {
            const violated = check.forbidden.some(ingredient =>
                fullText.includes(ingredient)
            );
            if (violated) {
                const matchedIngredients = check.forbidden.filter(ingredient =>
                    fullText.includes(ingredient)
                );
                issues.push({
                    type: 'dietary_restriction',
                    name: restriction,
                    severity: check.severity,
                    reason: `${check.reason} (detected: ${matchedIngredients.join(', ')})`,
                    isPersonal: true,
                });
            }
        }
    });

    return issues;
}

/**
 * Get Eco-Score environmental impact info
 * @param {string} ecoScore - Eco-Score grade (a-e)
 */
function getEcoScoreInfo(ecoScore) {
    const grades = {
        'a': { grade: 'A', label: 'Very Low Impact', color: '#038141', penalty: 0 },
        'b': { grade: 'B', label: 'Low Impact', color: '#85BB2F', penalty: 0 },
        'c': { grade: 'C', label: 'Moderate Impact', color: '#FECB02', penalty: 5 },
        'd': { grade: 'D', label: 'High Impact', color: '#EE8100', penalty: 10 },
        'e': { grade: 'E', label: 'Very High Impact', color: '#E63E11', penalty: 15 },
    };
    const grade = ecoScore?.toLowerCase();
    return grades[grade] || { grade: null, label: 'Unknown', color: '#999', penalty: 0 };
}

/**
 * Get NOVA processing group info
 * @param {number} novaGroup - NOVA group (1-4)
 */
function getNovaInfo(novaGroup) {
    const groups = {
        1: { group: 1, label: 'Unprocessed', color: '#038141', penalty: 0 },
        2: { group: 2, label: 'Processed Ingredients', color: '#85BB2F', penalty: 0 },
        3: { group: 3, label: 'Processed Foods', color: '#FECB02', penalty: 5 },
        4: { group: 4, label: 'Ultra-Processed', color: '#E63E11', penalty: 12 },
    };
    return groups[novaGroup] || { group: null, label: 'Unknown', color: '#999', penalty: 0 };
}


/**
 * Nutri-Score point thresholds (EU standard)
 * N component: negative points (0-40)
 * P component: positive points (0-15)
 */
const NUTRI_SCORE_THRESHOLDS = {
    // Negative points thresholds (per 100g)
    energy: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350], // kJ
    sugars: [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45], // g
    saturates: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // g
    sodium: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900], // mg
    // Positive points thresholds
    fiber: [0.9, 1.9, 2.8, 3.7, 4.7], // g (0-5 points)
    protein: [1.6, 3.2, 4.8, 6.4, 8.0], // g (0-5 points)
    fruitVeg: [40, 60, 80], // % (0, 1, 2, 5 points)
};

/**
 * Get points for a nutrient value based on thresholds
 */
function getPoints(value, thresholds) {
    if (!value || value < 0) return 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (value <= thresholds[i]) return i;
    }
    return thresholds.length;
}

/**
 * Get fruit/vegetable points (special scale: 0, 1, 2, 5)
 */
function getFruitVegPoints(percentage) {
    if (!percentage || percentage < 40) return 0;
    if (percentage < 60) return 1;
    if (percentage < 80) return 2;
    return 5;
}

/**
 * Calculate Nutri-Score based on EU algorithm
 * Returns score from -15 (best) to +40 (worst)
 * Also returns breakdown for UI display
 */
function calculateNutriScore(nutriments, fruitVegPercent = 0) {
    // Convert nutrients to correct units
    const energyKj = (nutriments.energy_kcal || nutriments.energy || 0) * 4.184; // kcal to kJ
    const sugars = nutriments.sugars || 0;
    const saturates = nutriments.saturated_fat || nutriments['saturated-fat'] || 0;
    const sodiumMg = (nutriments.sodium || 0) * 1000; // g to mg
    const fiber = nutriments.fiber || 0;
    const protein = nutriments.proteins || nutriments.protein || 0;

    // Calculate N component (negative points)
    const energyPoints = getPoints(energyKj, NUTRI_SCORE_THRESHOLDS.energy);
    const sugarPoints = getPoints(sugars, NUTRI_SCORE_THRESHOLDS.sugars);
    const saturatesPoints = getPoints(saturates, NUTRI_SCORE_THRESHOLDS.saturates);
    const sodiumPoints = getPoints(sodiumMg, NUTRI_SCORE_THRESHOLDS.sodium);
    const nComponent = energyPoints + sugarPoints + saturatesPoints + sodiumPoints;

    // Calculate P component (positive points)
    const fruitVegPoints = getFruitVegPoints(fruitVegPercent);
    const fiberPoints = getPoints(fiber, NUTRI_SCORE_THRESHOLDS.fiber);
    const proteinPoints = getPoints(protein, NUTRI_SCORE_THRESHOLDS.protein);
    let pComponent = fruitVegPoints + fiberPoints + proteinPoints;

    // Apply scoring rules:
    // If N >= 11 and fruit/veg < 5, don't count protein
    if (nComponent >= 11 && fruitVegPoints < 5) {
        pComponent = fruitVegPoints + fiberPoints;
    }

    const rawScore = nComponent - pComponent; // Range: -15 to +40

    return {
        rawScore,
        nComponent,
        pComponent,
        breakdown: {
            positives: {
                fruitVeg: { points: fruitVegPoints, value: fruitVegPercent, max: 5 },
                fiber: { points: fiberPoints, value: fiber, max: 5, unit: 'g' },
                protein: { points: proteinPoints, value: protein, max: 5, unit: 'g' },
            },
            negatives: {
                energy: { points: energyPoints, value: Math.round(energyKj / 4.184), max: 10, unit: 'kcal' },
                sugars: { points: sugarPoints, value: sugars, max: 10, unit: 'g' },
                saturates: { points: saturatesPoints, value: saturates, max: 10, unit: 'g' },
                sodium: { points: sodiumPoints, value: Math.round(sodiumMg), max: 10, unit: 'mg' },
            },
        },
    };
}

/**
 * Convert Nutri-Score raw score to 0-100 scale
 * -15 (best) -> 100, +40 (worst) -> 0
 */
function rawScoreTo100Scale(rawScore) {
    // Map -15 to 100, +40 to 0
    // Formula: 100 - ((rawScore + 15) / 55 * 100)
    const score = 100 - ((rawScore + 15) / 55 * 100);
    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get Nutri-Score letter grade (A-E)
 */
function getNutriScoreGrade(rawScore) {
    if (rawScore <= -1) return { grade: 'A', color: '#038141' };
    if (rawScore <= 2) return { grade: 'B', color: '#85BB2F' };
    if (rawScore <= 10) return { grade: 'C', color: '#FECB02' };
    if (rawScore <= 18) return { grade: 'D', color: '#EE8100' };
    return { grade: 'E', color: '#E63E11' };
}

/**
 * Calculate overall safety score (0-100) using Nutri-Score algorithm
 * Combines Nutri-Score nutritional analysis with issue-based adjustments,
 * environmental impact (Eco-Score), and processing level (NOVA)
 */
function calculateSafeScore(issues, nutriments = {}, ecoScoreInfo = {}, novaInfo = {}, ingredientOrigins = {}, healthConditionTriggers = []) {
    // Calculate base score from Nutri-Score
    const nutriScore = calculateNutriScore(nutriments);
    let score = rawScoreTo100Scale(nutriScore.rawScore);

    // NEW: Cumulative risk penalty logic (inspired by Think Dirty & Yuka)
    // Count issues by severity
    const criticalCount = issues.filter(i => i.severity === SAFETY_LEVELS.CRITICAL).length;
    const avoidCount = issues.filter(i => i.severity === SAFETY_LEVELS.AVOID).length;
    const cautionCount = issues.filter(i => i.severity === SAFETY_LEVELS.CAUTION).length;

    // Apply cumulative penalties with diminishing returns
    // CRITICAL: First issue -40, each additional -20 (severe penalty multiplication)
    if (criticalCount > 0) {
        score -= 40; // First critical issue
        if (criticalCount > 1) {
            score -= (criticalCount - 1) * 20; // Additional criticals
        }
    }

    // AVOID: First issue -25, each additional -12
    if (avoidCount > 0) {
        score -= 25; // First avoid issue
        if (avoidCount > 1) {
            score -= (avoidCount - 1) * 12; // Additional avoids
        }
    }

    // CAUTION: First issue -10, each additional -5
    if (cautionCount > 0) {
        score -= 10; // First caution
        if (cautionCount > 1) {
            score -= (cautionCount - 1) * 5; // Additional cautions
        }
    }

    // Hard cap if multiple critical issues (like Think Dirty's 10/10 worst-case rule)
    // If 2+ critical issues, product cannot score above 15/100
    if (criticalCount >= 2) {
        score = Math.min(score, 15);
    }

    // NEW: Apply health condition penalty (personalized scoring like EWG)
    if (healthConditionTriggers.length > 0) {
        const healthPenalty = calculateHealthConditionPenalty(healthConditionTriggers);
        score -= healthPenalty;
    }

    // NEW: Apply synthetic ingredient penalty (Fooducate-inspired)
    if (ingredientOrigins.synthetic > 0) {
        const syntheticPenalty = calculateSyntheticPenalty(
            ingredientOrigins.synthetic,
            ingredientOrigins.total
        );
        score -= syntheticPenalty;
    }

    // Apply Eco-Score penalty (environmental impact)
    if (ecoScoreInfo.penalty) {
        score -= ecoScoreInfo.penalty;
    }

    // Apply NOVA penalty (ultra-processed foods)
    if (novaInfo.penalty) {
        score -= novaInfo.penalty;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
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
    calculateNutriScore,
    getNutriScoreGrade,
};
