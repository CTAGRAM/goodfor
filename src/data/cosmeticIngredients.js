/**
 * Cosmetic Ingredients Database - Enhanced Algorithm v2.0
 * 
 * Comprehensive database of cosmetic ingredients with:
 * - 6-level risk classification (SAFE → BANNED)
 * - 5-pillar concern categories (toxicity, sensitization, endocrine, environment, data quality)
 * - INCI position-based concentration weighting
 * - Product type context modifiers
 * - Efficacy balance for proven actives
 * 
 * Sources: CosIng (EU), FDA, EWG Skin Deep, SCCS, IARC, SIN List, CIR, TEDX
 */

// ========== ENHANCED ALGORITHM v2.0 CONSTANTS ==========

/**
 * 6-Level Risk Classification (improved from Yuka's 4)
 */
export const RISK_LEVELS = {
    SAFE: { code: 0, label: 'Safe', color: '#22C55E', basePenalty: 0 },
    MINIMAL: { code: 1, label: 'Minimal Risk', color: '#84CC16', basePenalty: -2 },
    LOW: { code: 2, label: 'Low Risk', color: '#EAB308', basePenalty: -5 },
    MODERATE: { code: 3, label: 'Moderate Risk', color: '#F97316', basePenalty: -12 },
    HIGH: { code: 4, label: 'High Risk', color: '#EF4444', basePenalty: -25 },
    BANNED: { code: 5, label: 'Banned/Critical', color: '#1F2937', basePenalty: -50 },
};

/**
 * 5-Pillar Concern Categories
 * Each ingredient can have multiple concerns across different pillars
 */
export const CONCERN_CATEGORIES = {
    // Pillar 1: Toxicity (25 points max)
    CARCINOGEN_1: { pillar: 'toxicity', penalty: -50, description: 'IARC Group 1 carcinogen' },
    CARCINOGEN_2A: { pillar: 'toxicity', penalty: -25, description: 'IARC Group 2A probable carcinogen' },
    CARCINOGEN_2B: { pillar: 'toxicity', penalty: -10, description: 'IARC Group 2B possible carcinogen' },
    REPRODUCTIVE_TOXIN: { pillar: 'toxicity', penalty: -20, description: 'Reproductive/developmental toxicity' },
    NEUROTOXIN: { pillar: 'toxicity', penalty: -15, description: 'Neurotoxicity concerns' },
    ORGAN_TOXIN: { pillar: 'toxicity', penalty: -12, description: 'Organ system toxicity' },
    IRRITANT_SEVERE: { pillar: 'toxicity', penalty: -10, description: 'Severe skin/eye irritant' },
    IRRITANT_MODERATE: { pillar: 'toxicity', penalty: -5, description: 'Moderate irritant' },
    IRRITANT_MILD: { pillar: 'toxicity', penalty: -2, description: 'Mild irritant' },

    // Pillar 2: Sensitization (25 points max)
    ALLERGEN_BANNED: { pillar: 'sensitization', penalty: -25, description: 'EU banned allergen (LYRAL, LILIAL)' },
    ALLERGEN_EU26_HIGH: { pillar: 'sensitization', penalty: -8, description: 'EU 26 allergen (high potency)' },
    ALLERGEN_EU26: { pillar: 'sensitization', penalty: -5, description: 'EU 26 fragrance allergen' },
    ALLERGEN_CONTACT: { pillar: 'sensitization', penalty: -6, description: 'Known contact allergen' },
    SENSITIZER: { pillar: 'sensitization', penalty: -8, description: 'Known sensitizer' },
    PHOTOSENSITIZER: { pillar: 'sensitization', penalty: -5, description: 'Increases sun sensitivity' },

    // Pillar 3: Endocrine Disruption (25 points max)
    ENDOCRINE_SIN: { pillar: 'endocrine', penalty: -20, description: 'SIN List (Substitute It Now)' },
    ENDOCRINE_TEDX: { pillar: 'endocrine', penalty: -15, description: 'TEDX List confirmed' },
    ENDOCRINE_ED1: { pillar: 'endocrine', penalty: -18, description: 'ED Lists Category 1' },
    ENDOCRINE_ED2: { pillar: 'endocrine', penalty: -12, description: 'ED Lists Category 2' },
    ENDOCRINE_SUSPECTED: { pillar: 'endocrine', penalty: -6, description: 'Suspected endocrine effects' },
    ESTROGENIC: { pillar: 'endocrine', penalty: -8, description: 'Estrogenic activity' },

    // Pillar 4: Environmental (15 points max)
    REEF_TOXIC: { pillar: 'environment', penalty: -10, description: 'Coral reef toxic (Hawaii banned)' },
    BIOACCUMULATIVE: { pillar: 'environment', penalty: -8, description: 'Bioaccumulates in environment' },
    PERSISTENT: { pillar: 'environment', penalty: -5, description: 'Environmentally persistent' },
    MICROPLASTIC: { pillar: 'environment', penalty: -8, description: 'Microplastic/non-biodegradable' },
    WATER_POLLUTANT: { pillar: 'environment', penalty: -4, description: 'Water pollution concern' },

    // Pillar 5: Data Quality (10 points max) - applied at product level, not ingredient
};

/**
 * INCI Position-Based Multipliers
 * Addresses the key Yuka criticism: "doesn't consider concentration"
 * 
 * Higher position = lower concentration = lower multiplier
 */
export const POSITION_MULTIPLIERS = {
    getMultiplier: (position, isAfterFragrance = false) => {
        if (isAfterFragrance) return 0.25;  // Trace amount (EU disclosure threshold)
        if (position <= 3) return 1.8;       // Very high concentration (>10%)
        if (position <= 5) return 1.5;       // High concentration (5-10%)
        if (position <= 10) return 1.2;      // Medium-high (2-5%)
        if (position <= 15) return 1.0;      // Standard (1-2%)
        if (position <= 20) return 0.7;      // Low (0.5-1%)
        if (position <= 25) return 0.5;      // Very low (0.1-0.5%)
        return 0.3;                          // Trace (<0.1%)
    },
};

/**
 * Product Type Context Modifiers
 * Same ingredient has different risk based on product type
 */
export const PRODUCT_TYPE_MODIFIERS = {
    LEAVE_ON: {
        sensitizerMultiplier: 1.3,
        irritantMultiplier: 1.2,
        exposureLevel: 'HIGH',
    },
    RINSE_OFF: {
        sensitizerMultiplier: 0.7,
        irritantMultiplier: 0.6,
        exposureLevel: 'LOW',
    },
    EYE_AREA: {
        sensitizerMultiplier: 1.5,
        irritantMultiplier: 1.8,
        additionalBans: ['RETINOL', 'STRONG_AHA'],
    },
    LIP_PRODUCT: {
        ingestibleConcern: true,
        carcinogenMultiplier: 1.4,
        exposureLevel: 'MEDIUM',
    },
    BABY_PRODUCT: {
        allMultipliers: 2.0,
        stricterThresholds: true,
    },
    SUNSCREEN: {
        mineralPreferred: true,
        reefToxinMultiplier: 2.0,
        endocrineMultiplier: 1.3,
    },
};

/**
 * Efficacy Ingredients Database
 * Balances risk with clinical benefit (unlike Yuka which only penalizes)
 */
export const EFFICACY_INGREDIENTS = {
    'RETINOL': {
        clinicalEvidence: 'STRONG',
        benefits: ['anti-aging', 'acne', 'hyperpigmentation'],
        efficacyBonus: 5,  // Counterbalances penalty for adults
        pregnancyOverride: 'CRITICAL',  // Still critical for pregnancy
        conditionBonus: { acne_prone: 3, aging_concerns: 5 },
    },
    'TRETINOIN': {
        clinicalEvidence: 'VERY_STRONG',
        benefits: ['acne', 'anti-aging', 'hyperpigmentation'],
        efficacyBonus: 8,
        pregnancyOverride: 'CRITICAL',
        conditionBonus: { acne_prone: 5 },
    },
    'SALICYLIC ACID': {
        clinicalEvidence: 'STRONG',
        benefits: ['acne', 'exfoliation', 'pore-clearing'],
        efficacyBonus: 4,
        pregnancyOverride: 'CAUTION',  // Low % OK
        conditionBonus: { acne_prone: 5, oily_skin: 3 },
    },
    'BENZOYL PEROXIDE': {
        clinicalEvidence: 'VERY_STRONG',
        benefits: ['acne'],
        efficacyBonus: 5,
        conditionBonus: { acne_prone: 8 },
    },
    'NIACINAMIDE': {
        clinicalEvidence: 'STRONG',
        benefits: ['barrier', 'brightening', 'oil-control', 'pores'],
        efficacyBonus: 3,
        conditionBonus: { sensitive_skin: 3, oily_skin: 2 },
    },
    'ASCORBIC ACID': {
        clinicalEvidence: 'STRONG',
        benefits: ['antioxidant', 'brightening', 'collagen'],
        efficacyBonus: 3,
        conditionBonus: { aging_concerns: 3, hyperpigmentation: 4 },
    },
    'HYALURONIC ACID': {
        clinicalEvidence: 'MODERATE',
        benefits: ['hydration', 'plumping'],
        efficacyBonus: 2,
        conditionBonus: { dry_skin: 4, dehydrated_skin: 5 },
    },
    'GLYCOLIC ACID': {
        clinicalEvidence: 'STRONG',
        benefits: ['exfoliation', 'texture', 'anti-aging'],
        efficacyBonus: 3,
        conditionBonus: { aging_concerns: 3, dull_skin: 4 },
    },
    'AZELAIC ACID': {
        clinicalEvidence: 'STRONG',
        benefits: ['acne', 'rosacea', 'brightening'],
        efficacyBonus: 4,
        pregnancySafe: true,
        conditionBonus: { acne_prone: 4, rosacea: 6, hyperpigmentation: 4 },
    },
    'BAKUCHIOL': {
        clinicalEvidence: 'MODERATE',
        benefits: ['anti-aging', 'retinol-alternative'],
        efficacyBonus: 2,
        pregnancySafe: true,
        conditionBonus: { aging_concerns: 3, sensitive_skin: 2 },
    },
};

export const COSMETIC_INGREDIENTS = {
    // ========== RETINOIDS ==========
    'retinol': {
        inci: 'RETINOL',
        category: 'Retinoid',
        function: 'Anti-aging, cell turnover',
        safetyLevel: 'CAUTION',
        concerns: [
            'Pregnancy risk - linked to birth defects',
            'Increases sun sensitivity',
            'Can cause irritation, peeling, dryness',
        ],
        pregnancyRating: 'CRITICAL',
        infantRating: 'AVOID',
        alternatives: 'Bakuchiol (plant-based), Vitamin C, Niacinamide',
        sources: ['FDA', 'EFSA', 'AAD'],
    },
    'tretinoin': {
        inci: 'TRETINOIN',
        category: 'Retinoid (Prescription)',
        function: 'Acne treatment, anti-aging',
        safetyLevel: 'AVOID',
        concerns: [
            'Prescription only - teratogenic',
            'Category X in pregnancy',
            'Severe irritation possible',
        ],
        pregnancyRating: 'CRITICAL',
        infantRating: 'CRITICAL',
        alternatives: 'Adapalene (OTC), Bakuchiol',
        sources: ['FDA'],
    },
    'retinyl palmitate': {
        inci: 'RETINYL PALMITATE',
        category: 'Retinoid',
        function: 'Anti-aging (weaker than retinol)',
        safetyLevel: 'CAUTION',
        concerns: [
            'May accelerate sun damage when exposed to UV',
            'Pregnancy concerns (all retinoids)',
        ],
        pregnancyRating: 'AVOID',
        infantRating: 'AVOID',
        alternatives: 'Vitamin C, Niacinamide',
        sources: ['EWG', 'FDA'],
    },

    // ========== SUNSCREEN FILTERS ==========
    'oxybenzone': {
        inci: 'BENZOPHENONE-3',
        category: 'Chemical UV Filter',
        function: 'UVA/UVB protection',
        safetyLevel: 'AVOID',
        concerns: [
            'Hormone (endocrine) disruption',
            'Coral reef bleaching - banned in Hawaii, Palau',
            'Allergenic - common cause of photoallergy',
            'Detected in breast milk and blood',
        ],
        pregnancyRating: 'AVOID',
        infantRating: 'CRITICAL',
        alternatives: 'Zinc oxide, Titanium dioxide',
        sources: ['FDA', 'EWG', 'NOAA'],
    },
    'octinoxate': {
        inci: 'ETHYLHEXYL METHOXYCINNAMATE',
        category: 'Chemical UV Filter',
        function: 'UVB protection',
        safetyLevel: 'CAUTION',
        concerns: [
            'Endocrine disruption concerns',
            'Coral reef damage',
            'Degrades in sunlight releasing free radicals',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'AVOID',
        alternatives: 'Zinc oxide, Titanium dioxide',
        sources: ['FDA', 'Hawaii DOH'],
    },
    'zinc oxide': {
        inci: 'ZINC OXIDE',
        category: 'Mineral UV Filter',
        function: 'Physical UVA/UVB blocker',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Recommended for sensitive skin and babies 6+ months',
        sources: ['FDA GRAS', 'AAD'],
    },
    'titanium dioxide': {
        inci: 'TITANIUM DIOXIDE',
        category: 'Mineral UV Filter',
        function: 'Physical UVB blocker',
        safetyLevel: 'SAFE',
        concerns: [
            'Inhalation concerns in powder/spray form only',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Safe in lotions/creams, avoid powder inhalation',
        sources: ['FDA GRAS'],
    },
    'avobenzone': {
        inci: 'BUTYL METHOXYDIBENZOYLMETHANE',
        category: 'Chemical UV Filter',
        function: 'UVA protection',
        safetyLevel: 'CAUTION',
        concerns: [
            'Unstable - breaks down in sun without stabilizers',
            'Requires octocrylene or other stabilizers',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'CAUTION',
        alternatives: 'Zinc oxide for UVA',
        sources: ['FDA'],
    },

    // ========== PRESERVATIVES ==========
    'methylparaben': {
        inci: 'METHYLPARABEN',
        category: 'Preservative (Paraben)',
        function: 'Antimicrobial',
        safetyLevel: 'CAUTION',
        concerns: [
            'Weak estrogenic activity',
            'Found in breast tumor tissue (controversial)',
            'Restricted in some EU baby products',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'CAUTION',
        alternatives: 'Phenoxyethanol, Sodium benzoate, Potassium sorbate',
        sources: ['SCCS', 'CIR'],
    },
    'propylparaben': {
        inci: 'PROPYLPARABEN',
        category: 'Preservative (Paraben)',
        function: 'Antimicrobial',
        safetyLevel: 'AVOID',
        concerns: [
            'Stronger estrogenic activity than methylparaben',
            'Banned in EU diaper creams and leave-on baby products',
        ],
        pregnancyRating: 'AVOID',
        infantRating: 'AVOID',
        alternatives: 'Phenoxyethanol, natural preservatives',
        sources: ['EU Regulation 1223/2009', 'SCCS'],
    },
    'phenoxyethanol': {
        inci: 'PHENOXYETHANOL',
        category: 'Preservative',
        function: 'Antimicrobial',
        safetyLevel: 'CAUTION',
        concerns: [
            'Restricted to max 1% in EU for all ages',
            'Japan restricts in baby products',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'CAUTION',
        notes: 'Generally safe at allowed concentrations',
        sources: ['SCCS', 'CIR'],
    },
    'formaldehyde': {
        inci: 'FORMALDEHYDE',
        category: 'Preservative',
        function: 'Antimicrobial',
        safetyLevel: 'CRITICAL',
        concerns: [
            'Known human carcinogen (IARC Group 1)',
            'Strong allergen and sensitizer',
            'Banned in EU cosmetics (2019)',
        ],
        pregnancyRating: 'CRITICAL',
        infantRating: 'CRITICAL',
        alternatives: 'Any modern preservative system',
        sources: ['IARC', 'EU Regulation'],
    },
    'dmdm hydantoin': {
        inci: 'DMDM HYDANTOIN',
        category: 'Formaldehyde Releaser',
        function: 'Preservative',
        safetyLevel: 'AVOID',
        concerns: [
            'Releases formaldehyde over time',
            'Sensitizer and allergen',
            'Subject of multiple lawsuits',
        ],
        pregnancyRating: 'AVOID',
        infantRating: 'CRITICAL',
        alternatives: 'Non-formaldehyde-releasing preservatives',
        sources: ['CIR', 'SCCS'],
    },

    // ========== SURFACTANTS ==========
    'sodium lauryl sulfate': {
        inci: 'SODIUM LAURYL SULFATE',
        category: 'Surfactant (Anionic)',
        function: 'Cleansing, foaming',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can irritate and dry skin',
            'May disrupt skin barrier',
            'Too harsh for sensitive/baby skin',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'AVOID',
        alternatives: 'Coco-glucoside, Decyl glucoside, Sodium cocoyl isethionate',
        sources: ['CIR'],
    },
    'sodium laureth sulfate': {
        inci: 'SODIUM LAURETH SULFATE',
        category: 'Surfactant (Anionic)',
        function: 'Cleansing, foaming',
        safetyLevel: 'CAUTION',
        concerns: [
            'Milder than SLS but still potentially irritating',
            'May contain 1,4-dioxane as contaminant',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'CAUTION',
        alternatives: 'Coco-glucoside, Sodium cocoyl glycinate',
        sources: ['CIR', 'EWG'],
    },
    'cocamidopropyl betaine': {
        inci: 'COCAMIDOPROPYL BETAINE',
        category: 'Surfactant (Amphoteric)',
        function: 'Mild cleansing, foam boosting',
        safetyLevel: 'SAFE',
        concerns: [
            'ACDS Allergen of the Year 2004',
            'Some people may be sensitized',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Generally mild and well-tolerated',
        sources: ['CIR', 'ACDS'],
    },

    // ========== SKIN ACTIVES ==========
    'salicylic acid': {
        inci: 'SALICYLIC ACID',
        category: 'BHA (Beta Hydroxy Acid)',
        function: 'Exfoliation, acne treatment',
        safetyLevel: 'CAUTION',
        concerns: [
            'High doses during pregnancy may be harmful',
            'Can increase sun sensitivity',
        ],
        pregnancyRating: 'CAUTION', // Low % in rinse-off OK
        infantRating: 'AVOID',
        notes: 'Topical use at 2% or less in pregnancy is controversial - consult doctor',
        alternatives: 'Glycolic acid (for exfoliation)',
        sources: ['FDA', 'AAD'],
    },
    'hydroquinone': {
        inci: 'HYDROQUINONE',
        category: 'Skin Lightening Agent',
        function: 'Reduces melanin production',
        safetyLevel: 'AVOID',
        concerns: [
            'Banned in EU, Japan, Australia for OTC use',
            'Ochronosis (paradoxical skin darkening)',
            'High systemic absorption',
        ],
        pregnancyRating: 'CRITICAL',
        infantRating: 'CRITICAL',
        alternatives: 'Vitamin C, Niacinamide, Alpha arbutin, Kojic acid',
        sources: ['FDA', 'EU Regulation'],
    },
    'niacinamide': {
        inci: 'NIACINAMIDE',
        category: 'Vitamin B3',
        function: 'Barrier repair, anti-aging, brightening',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Excellent ingredient for most skin types',
        sources: ['CIR'],
    },
    'hyaluronic acid': {
        inci: 'SODIUM HYALURONATE',
        category: 'Humectant',
        function: 'Hydration, plumping',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },
    'glycolic acid': {
        inci: 'GLYCOLIC ACID',
        category: 'AHA (Alpha Hydroxy Acid)',
        function: 'Exfoliation, anti-aging',
        safetyLevel: 'CAUTION',
        concerns: [
            'Increases sun sensitivity significantly',
            'Can cause burns if concentration too high',
        ],
        pregnancyRating: 'SAFE', // Topical is OK
        infantRating: 'AVOID',
        notes: 'Safe during pregnancy at cosmetic concentrations',
        sources: ['AAD', 'ACOG'],
    },
    'vitamin c': {
        inci: 'ASCORBIC ACID',
        category: 'Antioxidant',
        function: 'Brightening, antioxidant, collagen synthesis',
        safetyLevel: 'SAFE',
        concerns: [
            'Unstable - oxidizes easily',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },

    // ========== FRAGRANCES & ESSENTIAL OILS ==========
    'parfum': {
        inci: 'PARFUM',
        category: 'Fragrance',
        function: 'Scent',
        safetyLevel: 'CAUTION',
        concerns: [
            'Trade secret - individual components not disclosed',
            'Common cause of contact dermatitis',
            'May contain phthalates, allergens',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'CRITICAL',
        notes: 'Avoid for infants; sensitization risk',
        sources: ['IFRA', 'EWG'],
    },
    'eucalyptus oil': {
        inci: 'EUCALYPTUS GLOBULUS LEAF OIL',
        category: 'Essential Oil',
        function: 'Fragrance, antimicrobial',
        safetyLevel: 'CAUTION',
        concerns: [
            'Contains 1,8-cineole - respiratory risk for infants',
            'Can cause seizures in young children if ingested',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'CRITICAL',
        alternatives: 'Lavender (safe for babies 3+ months)',
        sources: ['Tisserand & Young', 'Poison Control'],
    },
    'peppermint oil': {
        inci: 'MENTHA PIPERITA OIL',
        category: 'Essential Oil',
        function: 'Fragrance, cooling',
        safetyLevel: 'CAUTION',
        concerns: [
            'Contains menthol - breathing issues in infants',
            'High 1,8-cineole content',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'CRITICAL',
        sources: ['Tisserand & Young'],
    },
    'lavender oil': {
        inci: 'LAVANDULA ANGUSTIFOLIA OIL',
        category: 'Essential Oil',
        function: 'Fragrance, calming',
        safetyLevel: 'SAFE',
        concerns: [
            'Prepubertal gynecomastia reported (controversial)',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'CAUTION', // OK for 3+ months diluted
        notes: 'One of the safest essential oils; dilute for babies',
        sources: ['Tisserand & Young'],
    },
    'tea tree oil': {
        inci: 'MELALEUCA ALTERNIFOLIA LEAF OIL',
        category: 'Essential Oil',
        function: 'Antimicrobial, acne treatment',
        safetyLevel: 'CAUTION',
        concerns: [
            'Toxic if ingested',
            'Can cause skin irritation undiluted',
            'Some hormone disruption concerns',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'AVOID',
        sources: ['Tisserand & Young', 'Poison Control'],
    },

    // ========== SILICONES ==========
    'dimethicone': {
        inci: 'DIMETHICONE',
        category: 'Silicone',
        function: 'Smoothing, barrier, slip',
        safetyLevel: 'SAFE',
        concerns: [
            'Not biodegradable (environmental concern)',
            'Can build up on hair',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },
    'cyclomethicone': {
        inci: 'CYCLOMETHICONE',
        category: 'Volatile Silicone',
        function: 'Slip, quick drying',
        safetyLevel: 'CAUTION',
        concerns: [
            'D4/D5 restricted in EU rinse-off products',
            'Environmental persistence',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['EU Regulation', 'SCCS'],
    },

    // ========== MINERAL INGREDIENTS ==========
    'talc': {
        inci: 'TALC',
        category: 'Mineral',
        function: 'Absorbent, texture',
        safetyLevel: 'AVOID',
        concerns: [
            'Historical asbestos contamination issues',
            'Respiratory risk if inhaled',
            'Johnson & Johnson lawsuits',
        ],
        pregnancyRating: 'CAUTION',
        infantRating: 'AVOID',
        alternatives: 'Cornstarch, Arrowroot powder, Kaolin clay',
        sources: ['FDA', 'IARC'],
    },
    'mica': {
        inci: 'MICA',
        category: 'Mineral',
        function: 'Shimmer, sparkle',
        safetyLevel: 'SAFE',
        concerns: [
            'Inhalation concerns in powder form',
            'Ethical sourcing concerns (child labor)',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },

    // ========== ALCOHOLS ==========
    'alcohol denat': {
        inci: 'ALCOHOL DENAT',
        category: 'Alcohol (Denatured)',
        function: 'Solvent, quick drying, antimicrobial',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can be very drying to skin',
            'May disrupt skin barrier with frequent use',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'CAUTION',
        notes: 'Fine in rinse-off products; avoid high concentrations in leave-on',
        sources: ['CIR'],
    },
    'cetyl alcohol': {
        inci: 'CETYL ALCOHOL',
        category: 'Fatty Alcohol',
        function: 'Emollient, thickener',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Not a drying alcohol - moisturizing',
        sources: ['CIR'],
    },
    'cetearyl alcohol': {
        inci: 'CETEARYL ALCOHOL',
        category: 'Fatty Alcohol',
        function: 'Emollient, emulsifier',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },

    // ========== PHTHALATES ==========
    'dibutyl phthalate': {
        inci: 'DIBUTYL PHTHALATE',
        category: 'Phthalate',
        function: 'Plasticizer (nail polish)',
        safetyLevel: 'CRITICAL',
        concerns: [
            'Endocrine disruptor',
            'Reproductive toxicity',
            'Banned in EU cosmetics',
        ],
        pregnancyRating: 'CRITICAL',
        infantRating: 'CRITICAL',
        alternatives: 'Phthalate-free nail polishes',
        sources: ['EU Regulation', 'FDA'],
    },
    'diethyl phthalate': {
        inci: 'DIETHYL PHTHALATE',
        category: 'Phthalate',
        function: 'Fragrance solvent',
        safetyLevel: 'AVOID',
        concerns: [
            'Endocrine disruption concerns',
            'Often hidden in "fragrance"',
        ],
        pregnancyRating: 'AVOID',
        infantRating: 'AVOID',
        sources: ['EWG', 'SCCS'],
    },

    // ========== NATURAL EMOLLIENTS ==========
    'shea butter': {
        inci: 'BUTYROSPERMUM PARKII BUTTER',
        category: 'Natural Emollient',
        function: 'Moisturizing, barrier repair',
        safetyLevel: 'SAFE',
        concerns: [
            'Rare: tree nut allergy cross-reactivity',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },
    'coconut oil': {
        inci: 'COCOS NUCIFERA OIL',
        category: 'Natural Oil',
        function: 'Moisturizing, antimicrobial',
        safetyLevel: 'SAFE',
        concerns: [
            'Comedogenic for some - may cause breakouts on face',
        ],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },
    'jojoba oil': {
        inci: 'SIMMONDSIA CHINENSIS SEED OIL',
        category: 'Natural Wax',
        function: 'Moisturizing, balancing',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        notes: 'Technically a wax; mimics skin sebum',
        sources: ['CIR'],
    },
    'aloe vera': {
        inci: 'ALOE BARBADENSIS LEAF JUICE',
        category: 'Natural Extract',
        function: 'Soothing, hydrating',
        safetyLevel: 'SAFE',
        concerns: [],
        pregnancyRating: 'SAFE',
        infantRating: 'SAFE',
        sources: ['CIR'],
    },
};

/**
 * Get ingredient information by INCI name or common name
 * @param {string} query - Ingredient name to look up
 * @returns {Object|null} Ingredient data or null if not found
 */
export function getCosmeticIngredientInfo(query) {
    if (!query) return null;

    const normalized = query.toLowerCase().trim();

    // Direct key match
    if (COSMETIC_INGREDIENTS[normalized]) {
        return COSMETIC_INGREDIENTS[normalized];
    }

    // Search by INCI name
    for (const [key, data] of Object.entries(COSMETIC_INGREDIENTS)) {
        if (data.inci.toLowerCase() === normalized) {
            return data;
        }
        // Partial match
        if (data.inci.toLowerCase().includes(normalized) || normalized.includes(data.inci.toLowerCase())) {
            return data;
        }
    }

    return null;
}

/**
 * Get all ingredients by safety level
 */
export function getIngredientsBySafety(level) {
    return Object.entries(COSMETIC_INGREDIENTS)
        .filter(([_, data]) => data.safetyLevel === level)
        .map(([key, data]) => ({ key, ...data }));
}

/**
 * Get all pregnancy-unsafe ingredients
 */
export function getPregnancyUnsafeIngredients() {
    return Object.entries(COSMETIC_INGREDIENTS)
        .filter(([_, data]) => ['CRITICAL', 'AVOID'].includes(data.pregnancyRating))
        .map(([key, data]) => ({ key, ...data }));
}

/**
 * Get all infant-unsafe ingredients
 */
export function getInfantUnsafeIngredients() {
    return Object.entries(COSMETIC_INGREDIENTS)
        .filter(([_, data]) => ['CRITICAL', 'AVOID'].includes(data.infantRating))
        .map(([key, data]) => ({ key, ...data }));
}
