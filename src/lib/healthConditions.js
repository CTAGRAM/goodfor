/**
 * Health Condition Profiles Module
 * 
 * Defines health conditions and their ingredient triggers for personalized safety scoring.
 * Based on competitor analysis (EWG, Think Dirty) and medical literature.
 */

export const HEALTH_CONDITIONS = {
    asthma: {
        id: 'asthma',
        name: 'Asthma',
        icon: 'lungs',
        description: 'Respiratory sensitivity to certain ingredients',
        triggers: [
            // Preservatives that trigger asthma
            { code: 'e220', name: 'Sulfur Dioxide', severity: 'CRITICAL', reason: 'Known asthma trigger (FDA documented)' },
            { code: 'e221', name: 'Sodium Sulfite', severity: 'CRITICAL', reason: 'Sulfite - major asthma trigger' },
            { code: 'e222', name: 'Sodium Hydrogen Sulfite', severity: 'CRITICAL', reason: 'Sulfite compound' },
            { code: 'e223', name: 'Sodium Metabisulfite', severity: 'CRITICAL', reason: 'Strong sulfite - asthma attacks' },
            { code: 'e224', name: 'Potassium Metabisulfite', severity: 'CRITICAL', reason: 'Sulfite compound' },
            { code: 'sulfites', name: 'Sulfites (any)', severity: 'CRITICAL', reason: 'Severe respiratory trigger' },
            // Preservatives
            { code: 'e210', name: 'Benzoic Acid', severity: 'AVOID', reason: 'May worsen asthma symptoms' },
            { code: 'e211', name: 'Sodium Benzoate', severity: 'AVOID', reason: 'Linked to asthma exacerbation' },
            // Synthetic fragrances
            { code: 'parfum', name: 'Parfum/Fragrance', severity: 'AVOID', reason: 'Common respiratory irritant' },
            { code: 'fragrance', name: 'Fragrance', severity: 'AVOID', reason: 'Respiratory irritant' },
        ],
        penaltyMultiplier: 1.5, // 50% higher penalties for triggers
    },

    eczema: {
        id: 'eczema',
        name: 'Eczema / Sensitive Skin',
        icon: 'skin',
        description: 'Skin sensitivity to irritants and allergens',
        triggers: [
            // Synthetic fragrances
            { code: 'parfum', name: 'Parfum', severity: 'AVOID', reason: 'Top skin irritant for eczema' },
            { code: 'fragrance', name: 'Fragrance', severity: 'AVOID', reason: 'Common eczema trigger' },
            // Preservatives
            { code: 'e214', name: 'Ethyl p-hydroxybenzoate', severity: 'AVOID', reason: 'Paraben - skin irritant' },
            { code: 'e215', name: 'Sodium Ethyl p-hydroxybenzoate', severity: 'AVOID', reason: 'Paraben compound' },
            { code: 'e218', name: 'Methyl p-hydroxybenzoate', severity: 'AVOID', reason: 'Paraben - eczema trigger' },
            { code: 'e219', name: 'Sodium Methyl p-hydroxybenzoate', severity: 'AVOID', reason: 'Paraben compound' },
            { code: 'methylisothiazolinone', name: 'Methylisothiazolinone', severity: 'CRITICAL', reason: 'Severe contact dermatitis trigger' },
            // Common irritants
            { code: 'sodium lauryl sulfate', name: 'Sodium Lauryl Sulfate (SLS)', severity: 'AVOID', reason: 'Dries and irritates skin' },
            { code: 'sls', name: 'SLS', severity: 'AVOID', reason: 'Strong skin irritant' },
        ],
        penaltyMultiplier: 1.3,
    },

    ibs: {
        id: 'ibs',
        name: 'IBS / Digestive Sensitivity',
        icon: 'stomach',
        description: 'Irritable Bowel Syndrome - sensitive to certain additives',
        triggers: [
            // Sugar alcohols (FODMAPs)
            { code: 'e420', name: 'Sorbitol', severity: 'AVOID', reason: 'High FODMAP - IBS trigger' },
            { code: 'e421', name: 'Mannitol', severity: 'AVOID', reason: 'Sugar alcohol - bloating' },
            { code: 'e953', name: 'Isomalt', severity: 'AVOID', reason: 'Sugar alcohol - digestive issues' },
            { code: 'e965', name: 'Maltitol', severity: 'AVOID', reason: 'FODMAP - IBS symptoms' },
            { code: 'e966', name: 'Lactitol', severity: 'AVOID', reason: 'Sugar alcohol' },
            { code: 'e967', name: 'Xylitol', severity: 'AVOID', reason: 'Common IBS trigger' },
            // Artificial sweeteners
            { code: 'e950', name: 'Acesulfame K', severity: 'CAUTION', reason: 'May cause digestive upset' },
            { code: 'e951', name: 'Aspartame', severity: 'CAUTION', reason: 'IBS symptom trigger' },
            { code: 'e955', name: 'Sucralose', severity: 'CAUTION', reason: 'May worsen IBS' },
            // Thickeners
            { code: 'e407', name: 'Carrageenan', severity: 'AVOID', reason: 'Inflammatory for sensitive gut' },
            // High fructose
            { code: 'high fructose corn syrup', name: 'HFCS', severity: 'CAUTION', reason: 'High FODMAP' },
        ],
        penaltyMultiplier: 1.4,
    },

    pregnancy: {
        id: 'pregnancy',
        name: 'Pregnancy',
        icon: 'pregnancy',
        description: 'Extra caution for expectant mothers',
        triggers: [
            // High-risk preservatives
            { code: 'e250', name: 'Sodium Nitrite', severity: 'CRITICAL', reason: 'Nitrosamine formation - pregnancy risk' },
            { code: 'e251', name: 'Sodium Nitrate', severity: 'CRITICAL', reason: 'Converts to nitrites' },
            // Synthetic sweeteners
            { code: 'e951', name: 'Aspartame', severity: 'AVOID', reason: 'Pregnancy caution (phenylalanine)' },
            { code: 'e954', name: 'Saccharin', severity: 'AVOID', reason: 'Crosses placenta' },
            // Caffeine (high amounts)
            { code: 'caffeine', name: 'Caffeine (high)', severity: 'CAUTION', reason: 'Limit to 200mg/day' },
            // Vitamin A (high doses)
            { code: 'retinol', name: 'Retinol/Vitamin A (high)', severity: 'AVOID', reason: 'Birth defect risk in high doses' },
            // Alcohol
            { code: 'alcohol', name: 'Alcohol', severity: 'CRITICAL', reason: 'No safe level in pregnancy' },
            // Certain antioxidants
            { code: 'e320', name: 'BHA', severity: 'AVOID', reason: 'Endocrine disruptor' },
            { code: 'e321', name: 'BHT', severity: 'AVOID', reason: 'Pregnancy caution' },
            // Raw/undercooked concerns
            { code: 'raw milk', name: 'Raw Milk', severity: 'CRITICAL', reason: 'Listeria risk' },
        ],
        penaltyMultiplier: 2.0, // Highest multiplier for pregnancy
    },

    migraines: {
        id: 'migraines',
        name: 'Migraines / Headaches',
        icon: 'headache',
        description: 'Sensitive to migraine-triggering additives',
        triggers: [
            // Preservatives
            { code: 'e250', name: 'Sodium Nitrite', severity: 'AVOID', reason: 'Common migraine trigger (processed meats)' },
            { code: 'e251', name: 'Sodium Nitrate', severity: 'AVOID', reason: 'Nitrate headaches' },
            // Flavor enhancers
            { code: 'e621', name: 'MSG', severity: 'AVOID', reason: 'Well-documented migraine trigger' },
            { code: 'e622', name: 'Monopotassium Glutamate', severity: 'AVOID', reason: 'MSG compound' },
            { code: 'e623', name: 'Calcium Diglutamate', severity: 'AVOID', reason: 'MSG-like effects' },
            { code: 'e635', name: 'Disodium 5\'-Ribonucleotides', severity: 'AVOID', reason: 'Often combined with MSG' },
            // Sweeteners
            { code: 'e951', name: 'Aspartame', severity: 'AVOID', reason: 'Migraine trigger for some' },
            // Tyramine-rich (aged foods)
            { code: 'aged cheese', name: 'Aged Cheese', severity: 'CAUTION', reason: 'High tyramine' },
            { code: 'tyramine', name: 'Tyramine', severity: 'CAUTION', reason: 'Migraine trigger' },
        ],
        penaltyMultiplier: 1.4,
    },
};

/**
 * Check if product contains triggers for user's health conditions
 * @param {Array<string>} ingredients - Product ingredients
 * @param {Array<string>} userConditions - User's health condition IDs
 * @returns {Array} List of triggered concerns with severity
 */
export function checkHealthConditionTriggers(ingredients, userConditions) {
    if (!ingredients || !userConditions || userConditions.length === 0) {
        return [];
    }

    const triggers = [];
    const normalizedIngredients = ingredients.map(ing => ing.toLowerCase().trim());

    userConditions.forEach(conditionId => {
        const condition = HEALTH_CONDITIONS[conditionId];
        if (!condition) return;

        condition.triggers.forEach(trigger => {
            const triggerCode = trigger.code.toLowerCase();

            // Check if ingredient matches trigger
            const isMatch = normalizedIngredients.some(ing =>
                ing.includes(triggerCode) || triggerCode.includes(ing)
            );

            if (isMatch) {
                triggers.push({
                    conditionId: condition.id,
                    conditionName: condition.name,
                    ingredientName: trigger.name,
                    severity: trigger.severity,
                    reason: trigger.reason,
                    penaltyMultiplier: condition.penaltyMultiplier,
                });
            }
        });
    });

    return triggers;
}

/**
 * Calculate additional penalty for health condition triggers
 * @param {Array} triggers - Health condition triggers found
 * @returns {number} Additional penalty points
 */
export function calculateHealthConditionPenalty(triggers) {
    if (!triggers || triggers.length === 0) return 0;

    let totalPenalty = 0;

    triggers.forEach(trigger => {
        let basePenalty = 0;

        // Base penalty by severity
        switch (trigger.severity) {
            case 'CRITICAL':
                basePenalty = 40;
                break;
            case 'AVOID':
                basePenalty = 25;
                break;
            case 'CAUTION':
                basePenalty = 10;
                break;
        }

        // Apply condition-specific multiplier
        const adjustedPenalty = basePenalty * (trigger.penaltyMultiplier || 1.0);
        totalPenalty += adjustedPenalty;
    });

    // Cap total health condition penalty at 80 points to leave room for other factors
    return Math.min(totalPenalty, 80);
}

/**
 * Get user-friendly list of conditions
 * @returns {Array} List of condition objects for UI
 */
export function getAvailableConditions() {
    return Object.values(HEALTH_CONDITIONS).map(condition => ({
        id: condition.id,
        name: condition.name,
        icon: condition.icon,
        description: condition.description,
        triggerCount: condition.triggers.length,
    }));
}
