/**
 * EU 26 Mandatory Fragrance Allergens Database
 * 
 * EU Regulation 1223/2009 - Cosmetics Regulation
 * Labeling required when present above threshold:
 * - Leave-on products: 0.001% (10 ppm)
 * - Rinse-off products: 0.01% (100 ppm)
 * 
 * Note: EU Regulation 2023/1545 expands to 80+ allergens by July 2026
 */

export const EU_26_FRAGRANCE_ALLERGENS = [
    {
        inci: 'AMYL CINNAMAL',
        casNumber: '122-40-7',
        aliases: ['amylcinnamaldehyde', 'alpha-amyl cinnamic aldehyde'],
        category: 'aldehyde',
        commonSources: ['jasmine fragrances', 'floral perfumes'],
    },
    {
        inci: 'BENZYL ALCOHOL',
        casNumber: '100-51-6',
        aliases: ['phenylmethanol', 'alpha-hydroxytoluene'],
        category: 'alcohol',
        commonSources: ['jasmine', 'hyacinth', 'solvent in cosmetics'],
    },
    {
        inci: 'CINNAMYL ALCOHOL',
        casNumber: '104-54-1',
        aliases: ['3-phenyl-2-propen-1-ol', 'styryl alcohol'],
        category: 'alcohol',
        commonSources: ['cinnamon', 'balsams'],
    },
    {
        inci: 'CITRAL',
        casNumber: '5392-40-5',
        aliases: ['geranial', 'neral', 'lemonal', '3,7-dimethyl-2,6-octadienal'],
        category: 'aldehyde',
        commonSources: ['lemongrass', 'lemon myrtle', 'citrus oils'],
    },
    {
        inci: 'EUGENOL',
        casNumber: '97-53-0',
        aliases: ['4-allyl-2-methoxyphenol'],
        category: 'phenol',
        commonSources: ['clove oil', 'cinnamon', 'bay leaf'],
    },
    {
        inci: 'HYDROXYCITRONELLAL',
        casNumber: '107-75-5',
        aliases: ['3,7-dimethyl-7-hydroxyoctanal'],
        category: 'aldehyde',
        commonSources: ['lily of the valley fragrances'],
    },
    {
        inci: 'ISOEUGENOL',
        casNumber: '97-54-1',
        aliases: ['2-methoxy-4-propenylphenol'],
        category: 'phenol',
        commonSources: ['ylang-ylang', 'clove', 'cinnamon'],
    },
    {
        inci: 'AMYLCINNAMYL ALCOHOL',
        casNumber: '101-85-9',
        aliases: ['alpha-amyl cinnamic alcohol'],
        category: 'alcohol',
        commonSources: ['synthetic fragrances'],
    },
    {
        inci: 'BENZYL SALICYLATE',
        casNumber: '118-58-1',
        aliases: ['benzyl 2-hydroxybenzoate'],
        category: 'ester',
        commonSources: ['balsam', 'floral fragrances', 'carnation'],
    },
    {
        inci: 'CINNAMAL',
        casNumber: '104-55-2',
        aliases: ['cinnamaldehyde', '3-phenyl-2-propenal'],
        category: 'aldehyde',
        commonSources: ['cinnamon bark oil', 'cassia'],
    },
    {
        inci: 'COUMARIN',
        casNumber: '91-64-5',
        aliases: ['2H-1-benzopyran-2-one'],
        category: 'lactone',
        commonSources: ['tonka bean', 'sweet clover', 'lavender'],
    },
    {
        inci: 'GERANIOL',
        casNumber: '106-24-1',
        aliases: ['3,7-dimethylocta-trans-2,6-dien-1-ol'],
        category: 'terpene',
        commonSources: ['rose', 'geranium', 'citronella'],
    },
    {
        inci: 'ANISE ALCOHOL',
        casNumber: '105-13-5',
        aliases: ['4-methoxybenzyl alcohol', 'para-anisyl alcohol'],
        category: 'alcohol',
        commonSources: ['anise', 'synthetic fragrances'],
    },
    {
        inci: 'BENZYL CINNAMATE',
        casNumber: '103-41-3',
        aliases: ['phenylmethyl 3-phenyl-2-propenoate'],
        category: 'ester',
        commonSources: ['balsam of Peru', 'balsam of Tolu'],
    },
    {
        inci: 'FARNESOL',
        casNumber: '4602-84-0',
        aliases: ['3,7,11-trimethyl-2,6,10-dodecatrien-1-ol'],
        category: 'terpene',
        commonSources: ['various floral oils', 'chamomile'],
    },
    {
        inci: 'BUTYLPHENYL METHYLPROPIONAL',
        casNumber: '80-54-6',
        aliases: ['lilial', 'p-BMHCA'],
        category: 'aldehyde',
        banned: true,
        banDate: '2022-03-01',
        banReason: 'Reproductive toxicity concerns',
        commonSources: ['lily of the valley, muguet fragrances'],
    },
    {
        inci: 'LINALOOL',
        casNumber: '78-70-6',
        aliases: ['3,7-dimethylocta-1,6-dien-3-ol'],
        category: 'terpene',
        commonSources: ['lavender', 'coriander', 'bergamot', 'most essential oils'],
    },
    {
        inci: 'BENZYL BENZOATE',
        casNumber: '120-51-4',
        aliases: ['phenylmethyl benzoate'],
        category: 'ester',
        commonSources: ['balsam of Peru', 'jasmine', 'ylang-ylang'],
    },
    {
        inci: 'CITRONELLOL',
        casNumber: '106-22-9',
        aliases: ['3,7-dimethyloct-6-en-1-ol'],
        category: 'terpene',
        commonSources: ['rose', 'geranium', 'citronella'],
    },
    {
        inci: 'HEXYL CINNAMAL',
        casNumber: '101-86-0',
        aliases: ['hexyl cinnamaldehyde', 'alpha-hexyl cinnamic aldehyde'],
        category: 'aldehyde',
        commonSources: ['chamomile', 'jasmine fragrances'],
    },
    {
        inci: 'LIMONENE',
        casNumber: '5989-27-5',
        aliases: ['d-limonene', '(R)-4-isopropenyl-1-methylcyclohexene'],
        category: 'terpene',
        commonSources: ['citrus peel oils', 'orange', 'lemon', 'grapefruit'],
    },
    {
        inci: 'METHYL 2-OCTYNOATE',
        casNumber: '111-12-6',
        aliases: ['methyl heptin carbonate'],
        category: 'ester',
        commonSources: ['violet fragrances'],
    },
    {
        inci: 'ALPHA-ISOMETHYL IONONE',
        casNumber: '127-51-5',
        aliases: ['isomethyl ionone', '3-methyl-4-(2,6,6-trimethyl-2-cyclohexen-1-yl)-3-buten-2-one'],
        category: 'ketone',
        commonSources: ['violet', 'orris root fragrances'],
    },
    {
        inci: 'EVERNIA PRUNASTRI EXTRACT',
        casNumber: '90028-68-5',
        aliases: ['oak moss extract', 'oak moss absolute'],
        category: 'natural',
        commonSources: ['chypre perfumes', 'fougère fragrances'],
    },
    {
        inci: 'EVERNIA FURFURACEA EXTRACT',
        casNumber: '90028-67-4',
        aliases: ['tree moss extract', 'tree moss absolute'],
        category: 'natural',
        commonSources: ['chypre perfumes', 'woody fragrances'],
    },
    {
        inci: 'HYDROXYISOHEXYL 3-CYCLOHEXENE CARBOXALDEHYDE',
        casNumber: '31906-04-4',
        aliases: ['lyral', 'HICC'],
        category: 'aldehyde',
        banned: true,
        banDate: '2021-08-23',
        banReason: 'High sensitization potential',
        commonSources: ['lily of the valley fragrances'],
    },
];

/**
 * Check if ingredients contain EU fragrance allergens
 * @param {Array} ingredients - Parsed ingredient list (strings or objects with 'name'/'normalized')
 * @param {number} ageMonths - Age in months (stricter for infants)
 * @returns {Array} Detected allergens with severity
 */
export function checkFragranceAllergens(ingredients, ageMonths = 216) {
    const detected = [];

    if (!ingredients || ingredients.length === 0) {
        return detected;
    }

    // Normalize ingredients to strings for matching
    const normalizedIngredients = ingredients.map(ing =>
        (typeof ing === 'string' ? ing : ing.normalized || ing.name || ing.raw || '')
            .toLowerCase()
    );

    for (const allergen of EU_26_FRAGRANCE_ALLERGENS) {
        // Check INCI name
        let found = normalizedIngredients.some(ing =>
            ing.includes(allergen.inci.toLowerCase())
        );

        // Check aliases
        if (!found && allergen.aliases) {
            found = allergen.aliases.some(alias =>
                normalizedIngredients.some(ing => ing.includes(alias.toLowerCase()))
            );
        }

        if (found) {
            // Determine severity based on age and ban status
            let severity = 'CAUTION';
            let reason = 'EU-regulated fragrance allergen - may cause skin sensitization';

            if (allergen.banned) {
                severity = 'CRITICAL';
                reason = `BANNED in EU since ${allergen.banDate} - ${allergen.banReason}`;
            } else if (ageMonths < 36) {
                // Stricter for infants and toddlers
                severity = 'AVOID';
                reason = 'EU fragrance allergen - avoid for infants and toddlers under 3 years';
            } else if (ageMonths < 12) {
                // Even stricter for babies
                severity = 'CRITICAL';
                reason = 'Fragrance allergen - not recommended for infants under 1 year';
            }

            detected.push({
                name: allergen.inci,
                casNumber: allergen.casNumber,
                severity,
                reason,
                category: 'FRAGRANCE_ALLERGEN',
                isBanned: allergen.banned || false,
                commonSources: allergen.commonSources || [],
            });
        }
    }

    return detected;
}

/**
 * Check for generic fragrance/parfum in baby products
 * ANY fragrance should be flagged for infants
 */
export function checkGenericFragrance(ingredients, ageMonths) {
    if (ageMonths >= 36) return []; // Only strict for under 3 years

    const fragrancePatterns = [
        /\bparfum\b/i,
        /\bfragrance\b/i,
        /\baroma\b/i,
        /\bflavor\b/i,
        /\bperfume\b/i,
    ];

    const normalizedIngredients = ingredients.map(ing =>
        (typeof ing === 'string' ? ing : ing.normalized || ing.name || ing.raw || '')
    );

    for (const pattern of fragrancePatterns) {
        if (normalizedIngredients.some(ing => pattern.test(ing))) {
            return [{
                name: 'PARFUM/FRAGRANCE',
                severity: ageMonths < 12 ? 'CRITICAL' : 'AVOID',
                reason: 'Any fragrance can cause skin sensitization in infants - avoid for babies under 3 years',
                category: 'FRAGRANCE',
            }];
        }
    }

    return [];
}

/**
 * Get all allergen names for quick reference
 */
export function getAllFragranceAllergenNames() {
    return EU_26_FRAGRANCE_ALLERGENS.map(a => a.inci);
}

/**
 * Get banned allergens only
 */
export function getBannedAllergens() {
    return EU_26_FRAGRANCE_ALLERGENS.filter(a => a.banned);
}
