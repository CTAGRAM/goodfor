/**
 * Natural vs. Synthetic Ingredient Classifier
 * 
 * Classifies food additives as natural or synthetic based on E-numbers and common names.
 * Applies additional penalties for synthetic ingredients as per competitor algorithm analysis.
 * 
 * Data sources: EU regulations, FDA classifications, OpenFoodFacts taxonomy
 */

// E-numbers that are NATURAL in origin
const NATURAL_E_NUMBERS = new Set([
    // Natural colorings
    'e100', // Curcumin (turmeric)
    'e101', // Riboflavin (vitamin B2)
    'e120', // Carmine (cochineal)
    'e140', // Chlorophylls
    'e141', // Copper complexes of chlorophylls
    'e150a', // Plain caramel
    'e150b', // Caustic sulphite caramel
    'e160a', // Carotenes (beta-carotene)
    'e160b', // Annatto
    'e160c', // Paprika extract
    'e160d', // Lycopene
    'e160e', // Beta-apo-8'-carotenal
    'e161b', // Lutein
    'e162', // Beetroot red
    'e163', // Anthocyanins

    // Natural preservatives & antioxidants
    'e270', // Lactic acid
    'e296', // Malic acid
    'e300', // Ascorbic acid (vitamin C)
    'e301', // Sodium ascorbate
    'e302', // Calcium ascorbate
    'e303', // Potassium ascorbate
    'e306', // Tocopherols (vitamin E)
    'e307', // Alpha-tocopherol
    'e308', // Gamma-tocopherol
    'e309', // Delta-tocopherol
    'e322', // Lecithin
    'e325', // Sodium lactate
    'e326', // Potassium lactate
    'e327', // Calcium lactate
    'e330', // Citric acid
    'e331', // Sodium citrates
    'e332', // Potassium citrates
    'e333', // Calcium citrates

    // Natural thickeners & stabilizers
    'e400', // Alginic acid
    'e401', // Sodium alginate
    'e402', // Potassium alginate
    'e403', // Ammonium alginate
    'e404', // Calcium alginate
    'e405', // Propane-1,2-diol alginate
    'e406', // Agar
    'e407', // Carrageenan
    'e410', // Locust bean gum
    'e412', // Guar gum
    'e413', // Tragacanth
    'e414', // Acacia gum (gum arabic)
    'e415', // Xanthan gum
    'e416', // Karaya gum
    'e417', // Tara gum
    'e418', // Gellan gum
    'e440', // Pectins
    'e460', // Cellulose
    'e461', // Methyl cellulose
    'e466', // Carboxymethyl cellulose

    // Natural emulsifiers
    'e471', // Mono- and diglycerides (can be natural if plant-derived)
    'e472a', // Acetic acid esters of mono- and diglycerides
]);

// E-numbers that are SYNTHETIC
const SYNTHETIC_E_NUMBERS = new Set([
    // Synthetic colorings (azo dyes and others)
    'e102', // Tartrazine
    'e104', // Quinoline yellow
    'e107', // Yellow 2G
    'e110', // Sunset yellow FCF
    'e122', // Azorubine
    'e123', // Amaranth
    'e124', // Ponceau 4R
    'e127', // Erythrosine
    'e128', // Red 2G
    'e129', // Allura red AC
    'e131', // Patent blue V
    'e132', // Indigotine
    'e133', // Brilliant blue FCF
    'e142', // Green S
    'e151', // Brilliant black BN
    'e155', // Brown HT
    'e180', // Lithol rubine BK

    // Synthetic preservatives
    'e200', // Sorbic acid (synthetic production)
    'e201', // Sodium sorbate
    'e202', // Potassium sorbate
    'e203', // Calcium sorbate
    'e210', // Benzoic acid
    'e211', // Sodium benzoate
    'e212', // Potassium benzoate
    'e213', // Calcium benzoate
    'e214', // Ethyl p-hydroxybenzoate
    'e215', // Sodium ethyl p-hydroxybenzoate
    'e218', // Methyl p-hydroxybenzoate
    'e219', // Sodium methyl p-hydroxybenzoate
    'e220', // Sulfur dioxide
    'e221', // Sodium sulfite
    'e222', // Sodium hydrogen sulfite
    'e223', // Sodium metabisulfite
    'e224', // Potassium metabisulfite
    'e226', // Calcium sulfite
    'e227', // Calcium hydrogen sulfite
    'e228', // Potassium hydrogen sulfite
    'e230', // Biphenyl (diphenyl)
    'e231', // Orthophenyl phenol
    'e232', // Sodium orthophenyl phenol
    'e234', // Nisin
    'e235', // Natamycin
    'e239', // Hexamethylene tetramine
    'e242', // Dimethyl dicarbonate
    'e249', // Potassium nitrite
    'e250', // Sodium nitrite
    'e251', // Sodium nitrate
    'e252', // Potassium nitrate

    // Synthetic antioxidants
    'e310', // Propyl gallate
    'e311', // Octyl gallate
    'e312', // Dodecyl gallate
    'e319', // tert-Butylhydroquinone (TBHQ)
    'e320', // Butylated hydroxyanisole (BHA)
    'e321', // Butylated hydroxytoluene (BHT)

    // Artificial sweeteners
    'e950', // Acesulfame K
    'e951', // Aspartame
    'e952', // Cyclamic acid
    'e953', // Isomalt
    'e954', // Saccharin
    'e955', // Sucralose
    'e956', // Alitame
    'e957', // Thaumatin (natural but synthetically processed)
    'e959', // Neohesperidine dihydrochalcone
    'e960', // Steviol glycosides (natural origin but processed)
    'e961', // Neotame
    'e962', // Salt of aspartame-acesulfame
    'e965', // Maltitol
    'e966', // Lactitol
    'e967', // Xylitol

    // Flavor enhancers
    'e620', // Glutamic acid
    'e621', // Monosodium glutamate (MSG)
    'e622', // Monopotassium glutamate
    'e623', // Calcium diglutamate
    'e624', // Monoammonium glutamate
    'e625', // Magnesium diglutamate
    'e626', // Guanylic acid
    'e627', // Disodium guanylate
    'e628', // Dipotassium guanylate
    'e629', // Calcium guanylate
    'e630', // Inosinic acid
    'e631', // Disodium inosinate
    'e632', // Dipotassium inosinate
    'e633', // Calcium inosinate
    'e634', // Calcium 5'-ribonucleotides
    'e635', // Disodium 5'-ribonucleotides
]);

/**
 * Classify an ingredient as natural or synthetic
 * @param {string} ingredientCode - E-number or ingredient name
 * @returns {'natural'|'synthetic'|'unknown'}
 */
export function classifyIngredient(ingredientCode) {
    if (!ingredientCode) return 'unknown';

    const normalized = ingredientCode.toLowerCase().trim();

    // Check E-number classification
    if (NATURAL_E_NUMBERS.has(normalized)) {
        return 'natural';
    }

    if (SYNTHETIC_E_NUMBERS.has(normalized)) {
        return 'synthetic';
    }

    // Pattern matching for common synthetic indicators
    const syntheticPatterns = [
        /artificial/i,
        /synthetic/i,
        /fd&c/i,
        /yellow \d+/i,
        /red \d+/i,
        /blue \d+/i,
        /lake$/i, // Color lakes are synthetic
        /polysorbate/i,
        /propylene glycol/i,
    ];

    if (syntheticPatterns.some(pattern => pattern.test(normalized))) {
        return 'synthetic';
    }

    // Pattern matching for natural indicators
    const naturalPatterns = [
        /natural/i,
        /organic/i,
        /extract$/i,
        /juice$/i,
        /oil$/i,
        /powder$/i,
    ];

    if (naturalPatterns.some(pattern => pattern.test(normalized))) {
        return 'natural';
    }

    return 'unknown';
}

/**
 * Count natural vs synthetic ingredients in a product
 * @param {Array<string>} ingredients - List of ingredient codes/names
 * @returns {Object} Counts and percentages
 */
export function analyzeIngredientOrigins(ingredients) {
    if (!ingredients || ingredients.length === 0) {
        return {
            total: 0,
            natural: 0,
            synthetic: 0,
            unknown: 0,
            syntheticPercentage: 0,
            hasSynthetic: false,
        };
    }

    const classifications = ingredients.map(ing => classifyIngredient(ing));

    const natural = classifications.filter(c => c === 'natural').length;
    const synthetic = classifications.filter(c => c === 'synthetic').length;
    const unknown = classifications.filter(c => c === 'unknown').length;
    const total = ingredients.length;

    return {
        total,
        natural,
        synthetic,
        unknown,
        syntheticPercentage: total > 0 ? Math.round((synthetic / total) * 100) : 0,
        hasSynthetic: synthetic > 0,
    };
}

/**
 * Calculate penalty for synthetic ingredients (Fooducate-inspired)
 * @param {number} syntheticCount - Number of synthetic ingredients
 * @param {number} totalCount - Total ingredient count
 * @returns {number} Penalty to apply to safety score
 */
export function calculateSyntheticPenalty(syntheticCount, totalCount) {
    if (syntheticCount === 0 || totalCount === 0) return 0;

    const syntheticPercentage = (syntheticCount / totalCount) * 100;

    // Progressive penalty based on synthetic percentage
    if (syntheticPercentage >= 50) {
        // More than half synthetic = significant penalty
        return 15;
    } else if (syntheticPercentage >= 30) {
        // 30-50% synthetic = moderate penalty
        return 10;
    } else if (syntheticPercentage >= 10) {
        // 10-30% synthetic = minor penalty
        return 5;
    } else if (syntheticCount >= 1) {
        // At least 1 synthetic = small penalty
        return 2;
    }

    return 0;
}

/**
 * Get all synthetic ingredients from a list
 * @param {Array<string>} ingredients
 * @returns {Array<string>} List of synthetic ingredients
 */
export function getSyntheticIngredients(ingredients) {
    if (!ingredients) return [];
    return ingredients.filter(ing => classifyIngredient(ing) === 'synthetic');
}
