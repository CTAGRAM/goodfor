/**
 * Comprehensive Ingredient Database
 * 
 * Contains detailed information about common food additives and ingredients
 * including health concerns, scientific evidence, regulatory status, and alternatives.
 * 
 * Data sources: FDA, EFSA, WHO, IARC, scientific literature
 */

export const INGREDIENT_DATABASE = {
    // ===== SYNTHETIC COLORINGS =====
    'e102': {
        name: 'Tartrazine (Yellow 5)',
        aliases: ['tartrazine', 'yellow 5', 'fd&c yellow no. 5'],
        category: 'Synthetic Food Coloring',
        safetyLevel: 'CAUTION',
        concerns: [
            'May cause hyperactivity in sensitive children',
            'Potential allergen for aspirin-sensitive individuals',
            'Associated with behavioral changes in some studies',
            'Banned in Norway and Austria'
        ],
        scientificEvidence: 'Southampton University study (2007) linked artificial colorings including tartrazine to behavioral changes in children. McCann et al., The Lancet.',
        sources: ['FDA', 'EFSA', 'WHO'],
        alternatives: 'Natural alternatives: beta-carotene, turmeric, annatto extract',
        regulatoryStatus: {
            EU: 'Permitted with warning label required',
            US: 'FDA approved',
            UK: 'Permitted with warning label'
        },
        ageRestrictions: {
            infant: 'AVOID',
            toddler: 'AVOID',
            child: 'CAUTION'
        }
    },

    'e110': {
        name: 'Sunset Yellow FCF (Yellow 6)',
        aliases: ['sunset yellow', 'yellow 6', 'orange yellow s'],
        category: 'Synthetic Food Coloring',
        safetyLevel: 'CAUTION',
        concerns: [
            'May trigger hyperactivity in children',
            'Possible allergic reactions',
            'Azo dye - concerns about safety'
        ],
        scientificEvidence: 'Included in Southampton study on hyperactivity. EFSA re-evaluated acceptable daily intake in 2014.',
        sources: ['FDA', 'EFSA'],
        alternatives: 'Beta-carotene, paprika extract',
        regulatoryStatus: {
            EU: 'Permitted with warning',
            US: 'FDA approved',
            UK: 'Permitted with warning'
        }
    },

    'e129': {
        name: 'Allura Red AC (Red 40)',
        aliases: ['allura red', 'red 40', 'fd&c red no. 40'],
        category: 'Synthetic Food Coloring',
        safetyLevel: 'CAUTION',
        concerns: [
            'Linked to hyperactivity in children',
            'Potential allergen',
            'Most widely used synthetic food dye'
        ],
        scientificEvidence: 'Southampton study participant. California requires warning labels for products containing this dye.',
        sources: ['FDA', 'EFSA', 'CSPI'],
        alternatives: 'Beetroot extract, anthocyanins',
        regulatoryStatus: {
            EU: 'Permitted with warning',
            US: 'FDA approved',
            UK: 'Permitted with warning'
        }
    },

    // ===== PRESERVATIVES =====
    'e211': {
        name: 'Sodium Benzoate',
        aliases: ['sodium benzoate', 'benzoate of soda'],
        category: 'Preservative',
        safetyLevel: 'CAUTION',
        concerns: [
            'When combined with vitamin C, can form benzene (potential carcinogen)',
            'May exacerbate asthma symptoms',
            'Linked to hyperactivity when combined with artificial colors'
        ],
        scientificEvidence: 'FDA investigation (2006) found benzene formation in some beverages. WHO evaluates acceptable daily intake.',
        sources: ['FDA', 'WHO', 'EFSA'],
        alternatives: 'Natural preservatives: rosemary extract, vitamin E (tocopherols)',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS status',
            UK: 'Permitted'
        },
        ageRestrictions: {
            infant: 'CAUTION',
            toddler: 'CAUTION'
        }
    },

    'e220': {
        name: 'Sulfur Dioxide',
        aliases: ['sulfur dioxide', 'sulphur dioxide', 'sulfites'],
        category: 'Preservative & Antioxidant',
        safetyLevel: 'AVOID',
        concerns: [
            'Can trigger severe asthma attacks',
            'Causes allergic reactions in sensitive individuals',
            'Destroys thiamine (vitamin B1)',
            'May cause headaches or nausea'
        ],
        scientificEvidence: 'FDA requires sulfite declaration on labels. Known asthma trigger - documented in medical literature.',
        sources: ['FDA', 'WHO', 'EFSA'],
        alternatives: 'Ascorbic acid, citric acid',
        regulatoryStatus: {
            EU: 'Permitted with limitations',
            US: 'FDA approved with labeling requirement',
            UK: 'Permitted with labeling'
        },
        healthConditionTriggers: ['asthma', 'migraines'],
        ageRestrictions: {
            infant: 'CRITICAL',
            toddler: 'AVOID',
            child: 'CAUTION'
        }
    },

    'e250': {
        name: 'Sodium Nitrite',
        aliases: ['sodium nitrite', 'nitrite'],
        category: 'Preservative & Color Fixative',
        safetyLevel: 'AVOID',
        concerns: [
            'Can form nitrosamines (carcinogenic) when cooked at high temperatures',
            'Linked to increased colorectal cancer risk',
            'May affect oxygen transport in blood',
            'Particularly concerning in processed meats'
        ],
        scientificEvidence: 'IARC classifies processed meats with nitrites as Group 1 carcinogen. WHO 2015 report.',
        sources: ['IARC', 'WHO', 'FDA'],
        alternatives: 'Celery powder, sea salt (for curing)',
        regulatoryStatus: {
            EU: 'Permitted with strict limits',
            US: 'FDA approved with limits',
            UK: 'Permitted with limits'
        },
        ageRestrictions: {
            infant: 'CRITICAL',
            toddler: 'CRITICAL',
            child: 'AVOID',
            pregnancy: 'AVOID'
        }
    },

    // ===== SWEETENERS =====
    'e951': {
        name: 'Aspartame',
        aliases: ['aspartame', 'nutrasweet', 'equal'],
        category: 'Artificial Sweetener',
        safetyLevel: 'CAUTION',
        concerns: [
            'Breaks down into phenylalanine (dangerous for PKU patients)',
            'May trigger migraines in sensitive individuals',
            'Controversial safety profile despite regulatory approval',
            'Not suitable for phenylketonuria (PKU) patients'
        ],
        scientificEvidence: 'EFSA comprehensive review (2013) deemed safe at current exposure levels. IARC (2023) classified as "possibly carcinogenic" (Group 2B).',
        sources: ['FDA', 'EFSA', 'IARC'],
        alternatives: 'Stevia, monk fruit extract, erythritol',
        regulatoryStatus: {
            EU: 'Permitted with ADI of 40 mg/kg',
            US: 'FDA approved',
            UK: 'Permitted'
        },
        healthConditionTriggers: ['pku', 'migraines'],
        ageRestrictions: {
            pregnancy: 'CAUTION'
        }
    },

    'e621': {
        name: 'Monosodium Glutamate (MSG)',
        aliases: ['msg', 'monosodium glutamate', 'glutamic acid'],
        category: 'Flavor Enhancer',
        safetyLevel: 'CAUTION',
        concerns: [
            'May cause "MSG symptom complex" in sensitive individuals (headaches, flushing, sweating)',
            'High sodium contributor',
            'Some studies link to weight gain',
            'May trigger migraines'
        ],
        scientificEvidence: 'FASEB review (1995) found no evidence of serious harm at typical dietary levels. FDA considers it GRAS.',
        sources: ['FDA GRAS', 'EFSA', 'WHO'],
        alternatives: 'Nutritional yeast, mushroom powder, seaweed',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS status',
            UK: 'Permitted'
        },
        healthConditionTriggers: ['migraines']
    },

    // ===== EMULSIFIERS =====
    'e322': {
        name: 'Lecithin',
        aliases: ['lecithin', 'soy lecithin', 'sunflower lecithin'],
        category: 'Emulsifier',
        safetyLevel: 'SAFE',
        concerns: [],
        scientificEvidence: 'Generally recognized as safe. Natural substance found in egg yolks and soybeans.',
        sources: ['FDA GRAS'],
        alternatives: 'N/A - generally safe',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    'e471': {
        name: 'Mono- and Diglycerides of Fatty Acids',
        aliases: ['mono and diglycerides', 'glycerides'],
        category: 'Emulsifier',
        safetyLevel: 'SAFE',
        concerns: [
            'May be derived from animal sources (not vegetarian/vegan if animal-sourced)',
            'Trans fat concerns if partially hydrogenated'
        ],
        scientificEvidence: 'FDA considers safe. No significant health concerns when from non-hydrogenated sources.',
        sources: ['FDA', 'EFSA'],
        alternatives: 'Lecithin, vegetable-derived emulsifiers',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    // ===== ANTIOXIDANTS =====
    'e300': {
        name: 'Ascorbic Acid (Vitamin C)',
        aliases: ['ascorbic acid', 'vitamin c'],
        category: 'Antioxidant',
        safetyLevel: 'SAFE',
        concerns: [],
        scientificEvidence: 'Essential nutrient. Safe and beneficial.',
        sources: ['FDA', 'EFSA'],
        alternatives: 'Natural vitamin C from fruits',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    'e320': {
        name: 'Butylated Hydroxyanisole (BHA)',
        aliases: ['bha', 'butylated hydroxyanisole'],
        category: 'Antioxidant',
        safetyLevel: 'AVOID',
        concerns: [
            'Possible carcinogen (IARC Group 2B)',
            'Endocrine disruptor concerns',
            'Banned in some countries',
            'May accumulate in body fat'
        ],
        scientificEvidence: 'IARC classifies as possibly carcinogenic to humans. California Prop 65 listed.',
        sources: ['IARC', 'FDA', 'California Prop 65'],
        alternatives: 'Vitamin E (tocopherols), rosemary extract',
        regulatoryStatus: {
            EU: 'Permitted with restrictions',
            US: 'FDA approved',
            Japan: 'Banned in some uses'
        },
        ageRestrictions: {
            infant: 'AVOID',
            toddler: 'AVOID',
            pregnancy: 'CAUTION'
        }
    },

    // ===== NATURAL ALTERNATIVES (for reference) =====
    'beta-carotene': {
        name: 'Beta-Carotene',
        aliases: ['beta carotene', 'provitamin a'],
        category: 'Natural Coloring',
        safetyLevel: 'SAFE',
        concerns: [],
        scientificEvidence: 'Natural precursor to vitamin A. Safe for use.',
        sources: ['FDA GRAS'],
        alternatives: 'N/A - natural option',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    'turmeric': {
        name: 'Turmeric (Curcumin)',
        aliases: ['turmeric', 'curcumin', 'e100'],
        category: 'Natural Coloring',
        safetyLevel: 'SAFE',
        concerns: [],
        scientificEvidence: 'Natural spice with anti-inflammatory properties. Safe for consumption.',
        sources: ['FDA GRAS', 'WHO'],
        alternatives: 'N/A - natural option',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    // ===================================================================
    // ===== BEAUTY / COSMETIC INGREDIENTS =====
    // ===================================================================

    // ===== PRESERVATIVES (Beauty) =====
    'phenoxyethanol': {
        name: 'Phenoxyethanol',
        aliases: ['phenoxyethanol', '2-phenoxyethanol', 'phenoxetol'],
        category: 'Preservative',
        function: 'Prevents microbial growth in cosmetic formulations',
        safetyLevel: 'SAFE',
        concerns: [
            'May cause irritation in very sensitive individuals at high concentrations',
            'Some studies questioned safety of the 1% limit set by SCCS',
        ],
        associatedRisks: ['Potential allergen', 'Irritant'],
        scientificEvidence: 'Phenoxyethanol is used in cosmetics to prevent the growth of microorganisms. Its maximum concentration in products is limited to 1% in the EU, the UK, and Australia, however it is not regulated in the USA or Canada.\n\nSome studies have questioned the safety of the 1% limit deemed acceptable by the SCCS (Scientific Committee on Consumer Safety). There may be risks associated with leave-on products designed for use on babies, such as diaper creams and wipes. Additionally, daily use of multiple cosmetics containing phenoxyethanol, such as sunscreens, could potentially lead to exceeding this 1% threshold.\n\nThis ingredient is also known to potentially trigger allergic reactions. Repeated exposure may cause developmental toxicity, adverse effects on the blood, liver, and fertility.',
        sources: ['2012, SCCS - Opinion on phenoxyethanol', 'CIR Expert Panel, 2012', 'EU Cosmetics Regulation 1223/2009'],
        alternatives: 'Ethylhexylglycerin, sodium benzoate (cosmetic grade), potassium sorbate',
        exposureContext: 'Within cosmetic safety limits at ≤1%. Rinse-off products pose lower exposure risk than leave-on products.',
        regulatoryStatus: {
            EU: 'Permitted up to 1%',
            US: 'Not specifically regulated — manufacturer responsibility',
            UK: 'Permitted up to 1%'
        },
        ageRestrictions: {
            infant: 'CAUTION',
            toddler: 'CAUTION'
        }
    },

    'methylparaben': {
        name: 'Methylparaben',
        aliases: ['methylparaben', 'methyl paraben', 'methyl 4-hydroxybenzoate', 'e218'],
        category: 'Preservative',
        function: 'Broad-spectrum antimicrobial preservative',
        safetyLevel: 'CAUTION',
        concerns: [
            'Weak estrogenic activity detected in vitro',
            'Found in breast tumor tissue (Darbre 2004), though causation not established',
            'May cause contact dermatitis in sensitized individuals',
        ],
        associatedRisks: ['Potential endocrine disruptor', 'Potential allergen'],
        scientificEvidence: 'Parabens have been used as preservatives since the 1920s. The SCCS concluded in 2014 that methylparaben and ethylparaben are safe at concentrations up to 0.4% (single) or 0.8% (combined). However, propylparaben and butylparaben were restricted to 0.14% due to endocrine concerns.\n\nA 2004 study by Darbre et al. detected parabens in breast tumour tissue, though no causal link to cancer was established. Subsequent reviews by SCCS and CIR confirmed the safety of short-chain parabens at permitted levels.',
        sources: ['2014, SCCS - Opinion on parabens', 'Darbre et al., J Appl Toxicol, 2004', 'CIR Safety Assessment, 2019'],
        alternatives: 'Phenoxyethanol, ethylhexylglycerin, natural preservative systems',
        exposureContext: 'Considered safe at permitted concentrations. Leave-on products assessed more strictly than rinse-off.',
        regulatoryStatus: {
            EU: 'Permitted up to 0.4% (single) / 0.8% (mix)',
            US: 'FDA — generally recognized as safe',
            UK: 'Permitted up to 0.4%'
        }
    },

    'methylisothiazolinone': {
        name: 'Methylisothiazolinone (MI)',
        aliases: ['methylisothiazolinone', 'mi', 'mit', '2-methyl-4-isothiazolin-3-one'],
        category: 'Preservative',
        function: 'Biocide preservative — prevents bacterial and fungal growth',
        safetyLevel: 'AVOID',
        concerns: [
            'Strong contact sensitizer — causes allergic contact dermatitis',
            'Banned in leave-on cosmetics in the EU since 2017',
            'Epidemic of MI allergy reported across Europe 2010-2015',
        ],
        associatedRisks: ['Potential allergen', 'Irritant'],
        scientificEvidence: 'MI was identified as the "allergen of the year" by the American Contact Dermatitis Society in 2013. The European Commission banned MI in leave-on cosmetic products in 2017 (Commission Regulation 2016/1198) following SCCS opinions confirming it as a strong sensitizer even at very low concentrations.\n\nIt remains permitted in rinse-off products at a maximum of 0.0015% (15 ppm), though some dermatologists advocate for a complete ban.',
        sources: ['2013, SCCS - Opinion on MI', 'EU Regulation 2016/1198', 'ACDS Allergen of the Year, 2013'],
        alternatives: 'Phenoxyethanol, sodium benzoate with potassium sorbate',
        exposureContext: 'Banned in leave-on products (EU). In rinse-off products, limited to 15 ppm. Still a sensitization risk at permitted levels for pre-sensitized individuals.',
        regulatoryStatus: {
            EU: 'Banned in leave-on; max 0.0015% in rinse-off',
            US: 'No specific restriction (manufacturer discretion)',
            UK: 'Banned in leave-on; max 0.0015% in rinse-off'
        }
    },

    // ===== SURFACTANTS =====
    'sodium lauryl sulfate': {
        name: 'Sodium Lauryl Sulfate (SLS)',
        aliases: ['sodium lauryl sulfate', 'sls', 'sodium dodecyl sulfate', 'sds'],
        category: 'Surfactant',
        function: 'Cleansing agent and foaming surfactant — removes oils and dirt',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can cause skin irritation, especially in leave-on products',
            'May disrupt skin barrier function with prolonged contact',
            'Can exacerbate eczema or dermatitis',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'SLS is one of the most widely studied surfactants in dermatology. It is routinely used as a positive control in irritation patch testing because of its reliable irritant properties. The CIR Expert Panel considers SLS safe as used in cosmetics when formulated to be non-irritating — typically in rinse-off products with brief skin contact.\n\nSLS does not bioaccumulate, is not a carcinogen, and is not an endocrine disruptor. Its primary concern is skin barrier disruption with extended exposure.',
        sources: ['CIR Expert Panel, 2005 (amended 2017)', 'SCCS Notes of Guidance, 11th Revision'],
        alternatives: 'Sodium lauryl sulfoacetate, coco-glucoside, decyl glucoside (milder surfactants)',
        exposureContext: 'Acceptable in brief-contact rinse-off products (shampoo, body wash). Not recommended in leave-on formulations, especially for sensitive or eczema-prone skin.',
        regulatoryStatus: {
            EU: 'Permitted — no specific restriction',
            US: 'FDA — safe as used',
            UK: 'Permitted'
        }
    },

    'sodium laureth sulfate': {
        name: 'Sodium Laureth Sulfate (SLES)',
        aliases: ['sodium laureth sulfate', 'sles', 'sodium lauryl ether sulfate'],
        category: 'Surfactant',
        function: 'Mild cleansing and foaming agent — gentler alternative to SLS',
        safetyLevel: 'SAFE',
        concerns: [
            'Potential for 1,4-dioxane contamination from ethoxylation process',
            'Milder than SLS but may still irritate very sensitive skin',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'SLES is the ethoxylated form of SLS, making it significantly milder on skin. The concern about 1,4-dioxane is related to the manufacturing process (ethoxylation), not the ingredient itself. Modern manufacturing has largely addressed this through vacuum stripping. FDA monitoring shows negligible levels in finished products.',
        sources: ['CIR Expert Panel, 2010', 'FDA Guidance on 1,4-Dioxane'],
        alternatives: 'Coco-glucoside, sodium cocoyl isethionate',
        exposureContext: 'Well-tolerated in rinse-off products. The 1,4-dioxane concern is a manufacturing quality issue, not an inherent ingredient risk.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA — safe as used',
            UK: 'Permitted'
        }
    },

    // ===== EMOLLIENTS & OILS =====
    'mineral oil': {
        name: 'Mineral Oil',
        aliases: ['mineral oil', 'paraffinum liquidum', 'petrolatum', 'petroleum jelly', 'white mineral oil'],
        category: 'Emollient',
        function: 'Skin protectant and moisture barrier — prevents transepidermal water loss',
        safetyLevel: 'SAFE',
        concerns: [
            'Cosmetic-grade mineral oil is highly refined and non-comedogenic',
            'May feel heavy or occlusive on oily skin types',
            'Environmental concerns regarding petroleum origin',
        ],
        associatedRisks: ['Pollutant'],
        scientificEvidence: 'Cosmetic-grade mineral oil is one of the most rigorously tested and safest skincare ingredients. It is non-sensitizing, non-comedogenic in refined form, and has an extensive safety record spanning decades. The WHO IARC classification of mineral oils as carcinogenic (Group 1) applies only to untreated or mildly treated mineral oils used in industrial settings — NOT cosmetic-grade refined mineral oils.\n\nSCCS and CIR have repeatedly confirmed the safety of highly refined mineral oil in cosmetics.',
        sources: ['CIR Expert Panel, 2012', 'SCCS Opinion, 2018', 'WHO IARC Monograph 100F (industrial only)'],
        alternatives: 'Squalane, jojoba oil, shea butter (plant-based alternatives)',
        exposureContext: 'Safe for all product categories including lip products. Cosmetic-grade is distinct from industrial-grade.',
        regulatoryStatus: {
            EU: 'Permitted (cosmetic grade)',
            US: 'FDA approved skin protectant',
            UK: 'Permitted (cosmetic grade)'
        }
    },

    'dimethicone': {
        name: 'Dimethicone',
        aliases: ['dimethicone', 'polydimethylsiloxane', 'pdms', 'silicone'],
        category: 'Emollient / Skin Conditioning',
        function: 'Silicone-based emollient — smooths skin, reduces friction, forms protective barrier',
        safetyLevel: 'SAFE',
        concerns: [
            'Not biodegradable — environmental persistence',
            'May cause build-up on hair with prolonged use without clarifying',
        ],
        associatedRisks: ['Pollutant'],
        scientificEvidence: 'Dimethicone has an excellent safety profile in cosmetics. It is non-comedogenic, non-sensitizing, and non-toxic. The CIR Expert Panel concluded it is safe as used in cosmetics. Its primary concern is environmental — silicones persist in the environment but are not classified as toxic to aquatic organisms at typical concentrations.',
        sources: ['CIR Expert Panel, 2003 (reaffirmed 2019)', 'SCCS Notes of Guidance'],
        alternatives: 'Plant-derived squalane, natural oils, hydrogenated polyisobutene',
        exposureContext: 'Safe for all product types including lip and eye area. Environmental concern rather than health concern.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA — safe as used',
            UK: 'Permitted'
        }
    },

    // ===== ACTIVE INGREDIENTS =====
    'retinol': {
        name: 'Retinol (Vitamin A)',
        aliases: ['retinol', 'vitamin a', 'retinaldehyde', 'retinal', 'retinyl palmitate'],
        category: 'Active — Anti-aging',
        function: 'Cell turnover accelerator — reduces wrinkles, promotes collagen production, fades hyperpigmentation',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can cause irritation, peeling, and sun sensitivity (retinoid dermatitis)',
            'Contraindicated in pregnancy — teratogenic risk with oral retinoids',
            'Requires gradual introduction to skincare routine',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'Retinol is among the most scientifically validated anti-aging ingredients. Topical retinoids have decades of clinical evidence supporting their efficacy for photoaging, acne, and hyperpigmentation. The SCCS evaluated retinol and concluded it is safe up to 0.3% in body lotions and 0.05% in face creams.\n\nOral retinoids (isotretinoin, tretinoin) are known teratogens. While topical retinol has much lower systemic absorption, the precautionary principle drives the pregnancy restriction.',
        sources: ['SCCS Opinion on Vitamin A, 2016', 'Mukherjee et al., Clinical Interventions in Aging, 2006'],
        alternatives: 'Bakuchiol (plant-based retinol alternative), peptides, vitamin C',
        exposureContext: 'Leave-on product. Use at night due to photosensitivity. Start with low concentrations (0.025-0.05%) and increase gradually.',
        regulatoryStatus: {
            EU: 'Restricted: max 0.3% retinol equivalent in body, 0.05% in face',
            US: 'Not specifically restricted in cosmetics (OTC drug if acne claim)',
            UK: 'Restricted per EU regulation'
        },
        ageRestrictions: {
            pregnancy: 'CRITICAL',
            infant: 'AVOID',
            toddler: 'AVOID'
        }
    },

    'niacinamide': {
        name: 'Niacinamide (Vitamin B3)',
        aliases: ['niacinamide', 'nicotinamide', 'vitamin b3'],
        category: 'Active — Skin Brightening',
        function: 'Multi-functional active — strengthens skin barrier, reduces hyperpigmentation, controls oil production',
        safetyLevel: 'SAFE',
        concerns: [
            'Mild flushing possible at very high concentrations (>10%)',
            'May cause mild tingling when first introduced',
        ],
        associatedRisks: [],
        scientificEvidence: 'Niacinamide is one of the most well-tolerated active ingredients in skincare. Clinical studies demonstrate efficacy at 2-5% for barrier repair, oil control, and hyperpigmentation. It is compatible with most other actives and has anti-inflammatory properties. No significant safety concerns have been identified at cosmetic concentrations.',
        sources: ['Gehring, Int J Cosmet Sci, 2004', 'Draelos et al., Dermatologic Therapy, 2005', 'CIR Expert Panel, 2005'],
        alternatives: 'Alpha arbutin, tranexamic acid (for brightening)',
        exposureContext: 'Safe for daily use in both leave-on and rinse-off products. Well-tolerated even on sensitive skin at 2-5%.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'hyaluronic acid': {
        name: 'Hyaluronic Acid',
        aliases: ['hyaluronic acid', 'sodium hyaluronate', 'ha', 'hyaluron'],
        category: 'Active — Humectant',
        function: 'Moisture-binding humectant — attracts and retains up to 1000x its weight in water',
        safetyLevel: 'SAFE',
        concerns: [],
        associatedRisks: [],
        scientificEvidence: 'Hyaluronic acid is a naturally occurring substance in human skin. Topical application has strong evidence for improving skin hydration and reducing fine lines. Different molecular weights penetrate to different skin depths. No safety concerns have been identified — it is one of the safest and most effective humectants available.',
        sources: ['Papakonstantinou et al., Dermato-Endocrinology, 2012', 'CIR Expert Panel, 2009'],
        alternatives: 'Glycerin, panthenol, betaine (other humectants)',
        exposureContext: 'Safe for all product types and all skin types. No restrictions on usage frequency or concentration.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'salicylic acid': {
        name: 'Salicylic Acid',
        aliases: ['salicylic acid', 'bha', 'beta hydroxy acid', '2-hydroxybenzoic acid'],
        category: 'Active — Exfoliant / Anti-Acne',
        function: 'Oil-soluble exfoliant — penetrates pores, reduces acne, promotes cell turnover',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can cause dryness, peeling, and irritation',
            'Sun sensitivity — requires SPF use',
            'Not recommended during pregnancy (aspirin derivative)',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'Salicylic acid is a beta-hydroxy acid with over 2000 years of use (derived from willow bark). In cosmetics, it is effective at 0.5-2% for acne and exfoliation. The SCCS has confirmed its safety in cosmetic products at concentrations up to 2% for rinse-off and leave-on products (except for children under 3).\n\nAs a derivative of aspirin, it carries a theoretical risk in pregnancy, though topical absorption is limited.',
        sources: ['SCCS Opinion on Salicylic Acid, 2018', 'CIR Expert Panel, 2003', 'Arif, Int J Biol Macromol, 2015'],
        alternatives: 'Mandelic acid, azelaic acid, willow bark extract',
        exposureContext: 'Effective in leave-on products at 0.5-2%. Use SPF during daytime. Start with lower concentrations.',
        regulatoryStatus: {
            EU: 'Permitted up to 2% (cosmetic); 3% (rinse-off); not for children < 3',
            US: 'OTC drug ingredient for acne (0.5-2%)',
            UK: 'Permitted up to 2%'
        },
        ageRestrictions: {
            pregnancy: 'CAUTION',
            infant: 'AVOID',
            toddler: 'AVOID',
            child: 'CAUTION'
        }
    },

    'ascorbyl glucoside': {
        name: 'Ascorbyl Glucoside (Vitamin C Derivative)',
        aliases: ['ascorbyl glucoside', 'vitamin c', 'l-ascorbic acid', 'ascorbic acid', 'sodium ascorbyl phosphate'],
        category: 'Active — Antioxidant',
        function: 'Antioxidant — neutralizes free radicals, brightens skin, stimulates collagen synthesis',
        safetyLevel: 'SAFE',
        concerns: [
            'L-ascorbic acid can be unstable and oxidize (turning yellow/brown)',
            'May tingle on sensitive skin at high concentrations (>15%)',
        ],
        associatedRisks: [],
        scientificEvidence: 'Vitamin C derivatives are among the most well-documented topical antioxidants. L-ascorbic acid (the most active form) is effective at 5-20% for photoprotection, collagen stimulation, and brightening. Stabilized derivatives like ascorbyl glucoside offer better stability with gentler application.\n\nClinical evidence strongly supports topical vitamin C for preventing and treating UV-induced photodamage.',
        sources: ['Pullar et al., Nutrients, 2017', 'Telang, Indian Dermatol Online J, 2013', 'CIR Expert Panel, 2005'],
        alternatives: 'Alpha arbutin, licorice root extract, niacinamide (for brightening)',
        exposureContext: 'Safe for daily use. Best used in morning routine under sunscreen for synergistic photoprotection.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    // ===== UV FILTERS / SUNSCREENS =====
    'oxybenzone': {
        name: 'Oxybenzone (Benzophenone-3)',
        aliases: ['oxybenzone', 'benzophenone-3', 'bp-3'],
        category: 'UV Filter — Chemical Sunscreen',
        function: 'Absorbs UVA and UVB radiation to protect skin from sun damage',
        safetyLevel: 'AVOID',
        concerns: [
            'Endocrine disrupting activity — estrogenic effects in vitro',
            'Detected in human blood, urine, and breast milk after topical application',
            'Coral reef toxicity — contributing to coral bleaching',
            'Photoallergic contact dermatitis in some individuals',
        ],
        associatedRisks: ['Potential endocrine disruptor', 'Potential allergen', 'Pollutant'],
        scientificEvidence: 'Oxybenzone is one of the most controversial UV filters. Multiple studies have detected systemic absorption after topical application at levels exceeding FDA safety thresholds. The FDA requested additional safety data in 2019, and the SCCS (2021) concluded it is safe only up to 2.2% (reduced from 6%).\n\nHawaii and Key West banned oxybenzone-containing sunscreens due to coral reef toxicity. The EWG rates it as one of the most concerning UV filters.',
        sources: ['2021, SCCS - Opinion on benzophenone-3', 'FDA Proposed Rule on Sunscreens, 2019', 'Downs et al., Arch Environ Contam Toxicol, 2016'],
        alternatives: 'Zinc oxide, titanium dioxide (mineral filters), tinosorb S/M',
        exposureContext: 'Leave-on product with high systemic absorption potential. On-market reformulation trend away from oxybenzone.',
        regulatoryStatus: {
            EU: 'Permitted up to 2.2% (reduced from 6%)',
            US: 'FDA — pending additional safety data',
            UK: 'Permitted up to 2.2%'
        },
        ageRestrictions: {
            pregnancy: 'AVOID',
            infant: 'AVOID',
            toddler: 'AVOID',
            child: 'CAUTION'
        }
    },

    'zinc oxide': {
        name: 'Zinc Oxide',
        aliases: ['zinc oxide', 'zno', 'ci 77947'],
        category: 'UV Filter — Mineral Sunscreen',
        function: 'Physical UV blocker — reflects and scatters UVA and UVB rays',
        safetyLevel: 'SAFE',
        concerns: [
            'Nano-particle forms may raise theoretical inhalation concerns in spray products',
            'Can leave white cast on deeper skin tones',
        ],
        associatedRisks: [],
        scientificEvidence: 'Zinc oxide is considered one of the safest and most effective broad-spectrum UV filters. The FDA classifies it as Category I (safe and effective). Unlike chemical filters, it sits on the skin surface and does not penetrate into the bloodstream. The SCCS has confirmed the safety of nano zinc oxide up to 25% in cosmetic sunscreens when not used in spray products.',
        sources: ['FDA Final Monograph on Sunscreens', 'SCCS Opinion on Zinc Oxide (nano), 2012', 'CIR Expert Panel'],
        alternatives: 'Titanium dioxide (alternative mineral filter)',
        exposureContext: 'Safe for all product types. Preferred for sensitive skin, children, and pregnancy. Avoid inhalation of spray formulations with nano particles.',
        regulatoryStatus: {
            EU: 'Permitted up to 25% (nano form restricted in sprays)',
            US: 'FDA Category I — safe and effective',
            UK: 'Permitted up to 25%'
        }
    },

    'titanium dioxide': {
        name: 'Titanium Dioxide',
        aliases: ['titanium dioxide', 'tio2', 'ci 77891'],
        category: 'UV Filter — Mineral Sunscreen / Colorant',
        function: 'Physical UV blocker and white pigment — provides UVB protection and opacity',
        safetyLevel: 'CAUTION',
        concerns: [
            'IARC classified as Group 2B carcinogen when INHALED (not topical)',
            'EU banned as food additive (E171) in 2022 — cosmetic use remains permitted',
            'Nano form in spray products raises inhalation concerns',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'Titanium dioxide is safe for topical cosmetic use. The IARC Group 2B classification applies to inhalation exposure (occupational dust), not topical application where it does not penetrate intact skin. The EU food ban reflects precautionary concerns about nanoparticle ingestion, not skin application.\n\nThe SCCS confirmed in 2020 that nano titanium dioxide is safe in cosmetics up to 25% when not used in applications that could lead to inhalation.',
        sources: ['SCCS Opinion on TiO2 (nano), 2020', 'IARC Monograph Vol 93 (inhalation only)', 'EU Regulation 2022/63 (food ban)'],
        alternatives: 'Zinc oxide, non-nano mineral filters',
        exposureContext: 'Safe for topical use in creams/lotions. Avoid spray/powder products with nano TiO2 to prevent inhalation.',
        regulatoryStatus: {
            EU: 'Permitted in cosmetics up to 25% (banned as food additive)',
            US: 'FDA Category I sunscreen — safe and effective',
            UK: 'Permitted in cosmetics'
        }
    },

    // ===== FRAGRANCE INGREDIENTS =====
    'parfum': {
        name: 'Parfum / Fragrance',
        aliases: ['parfum', 'fragrance', 'aroma', 'perfume'],
        category: 'Fragrance',
        function: 'Provides an appealing scent to the product — may mask raw material odors',
        safetyLevel: 'CAUTION',
        concerns: [
            'Umbrella term that can represent 3,000+ distinct chemicals',
            'Leading cause of cosmetic contact allergies',
            'Composition is not disclosed (trade secret protection)',
            'May contain EU-listed fragrance allergens',
        ],
        associatedRisks: ['Potential allergen', 'Irritant'],
        scientificEvidence: '"Fragrance" or "Parfum" on a label can represent a complex blend of dozens to hundreds of individual chemicals. The EU requires disclosure of 26 specific fragrance allergens when present above threshold levels (0.001% for leave-on, 0.01% for rinse-off). As of August 2023, this list was expanded to include additional allergens.\n\nFragrance is the most common cause of cosmetic contact dermatitis, affecting an estimated 1-4% of the general population.',
        sources: ['EU Cosmetics Regulation 1223/2009, Annex III', 'SCCS Opinion on Fragrance Allergens, 2012', 'de Groot AC, Contact Dermatitis, 2020'],
        alternatives: 'Fragrance-free formulations, essential oil blends (though these also contain allergens)',
        exposureContext: 'Leave-on products pose higher risk than rinse-off. Eye and lip area products should ideally be fragrance-free.',
        regulatoryStatus: {
            EU: '26 allergens must be declared above thresholds',
            US: 'Not required to disclose individual components',
            UK: '26 allergens must be declared'
        }
    },

    'linalool': {
        name: 'Linalool',
        aliases: ['linalool', 'linalol', 'beta-linalool'],
        category: 'Fragrance Allergen',
        function: 'Fragrance component — naturally found in lavender, coriander, and many essential oils',
        safetyLevel: 'CAUTION',
        concerns: [
            'EU-listed fragrance allergen — must be declared on labels',
            'Oxidized linalool is a more potent sensitizer than fresh linalool',
            'Sensitization risk increases with air exposure of the product',
        ],
        associatedRisks: ['Potential allergen'],
        scientificEvidence: 'Linalool itself is a weak sensitizer, but it auto-oxidizes on air exposure to form linalool hydroperoxides, which are potent contact allergens. This is why aged or improperly stored products containing linalool pose higher sensitization risk than fresh products.\n\nAccording to a study conducted by the European Commission, 1 to 9% of the European population is affected by an allergy caused by fragrant substances.',
        sources: ['2012, SCCS - Opinion on fragrance allergens in cosmetics', 'Sköld et al., Contact Dermatitis, 2004', 'EU Cosmetics Regulation Annex III'],
        alternatives: 'Synthetic fragrance alternatives, unscented formulations',
        exposureContext: 'Must be declared if >0.001% in leave-on products or >0.01% in rinse-off products. Oxidation risk increases with product age.',
        regulatoryStatus: {
            EU: 'Mandatory declaration above threshold',
            US: 'No specific disclosure requirement',
            UK: 'Mandatory declaration above threshold'
        }
    },

    'limonene': {
        name: 'Limonene',
        aliases: ['limonene', 'd-limonene', 'l-limonene', 'dipentene'],
        category: 'Fragrance Allergen',
        function: 'Fragrance component — provides citrus scent, naturally found in citrus peel oils',
        safetyLevel: 'CAUTION',
        concerns: [
            'EU-listed fragrance allergen requiring disclosure',
            'Oxidized limonene is a stronger sensitizer than fresh limonene',
            'Common in "natural" products due to citrus essential oil content',
        ],
        associatedRisks: ['Potential allergen'],
        scientificEvidence: 'Like linalool, limonene auto-oxidizes to form hydroperoxides that are potent contact allergens. Fresh limonene has low sensitization potential, but oxidized forms cause significant allergic contact dermatitis. Products with antioxidants added to prevent oxidation show lower sensitization rates.',
        sources: ['2012, SCCS - Opinion on fragrance allergens', 'Christensson et al., Contact Dermatitis, 2009', 'EU Cosmetics Regulation Annex III'],
        alternatives: 'Non-citrus fragrance profiles, synthetic alternatives',
        exposureContext: 'Must be declared if >0.001% (leave-on) or >0.01% (rinse-off). Products with antioxidant protection are preferred.',
        regulatoryStatus: {
            EU: 'Mandatory declaration above threshold',
            US: 'No specific disclosure requirement',
            UK: 'Mandatory declaration above threshold'
        }
    },

    'citronellol': {
        name: 'Citronellol',
        aliases: ['citronellol', 'dihydrogeraniol', 'beta-citronellol'],
        category: 'Fragrance Allergen',
        function: 'Fragrance component — rose-like floral scent found in geranium and rose oils',
        safetyLevel: 'CAUTION',
        concerns: [
            'EU-listed fragrance allergen',
            'Moderate sensitization potential',
        ],
        associatedRisks: ['Potential allergen'],
        scientificEvidence: 'Citronellol is classified as a contact allergen by the EU Scientific Committee. It is commonly found in rose and geranium-scented products. Patch test studies report a sensitization rate of approximately 1-3% in dermatitis patients.',
        sources: ['SCCS Opinion on Fragrance Allergens, 2012', 'IVDK Contact Allergy Data', 'EU Annex III'],
        alternatives: 'Synthetic floral fragrance alternatives',
        exposureContext: 'Must be declared above EU thresholds. Lower risk in rinse-off products.',
        regulatoryStatus: {
            EU: 'Mandatory declaration above threshold',
            US: 'No specific requirement',
            UK: 'Mandatory declaration'
        }
    },

    // ===== PEGs & ETHOXYLATES =====
    'peg': {
        name: 'Polyethylene Glycol (PEG)',
        aliases: ['peg', 'peg-7', 'peg-40', 'peg-100', 'polyethylene glycol'],
        category: 'Emulsifier / Penetration Enhancer',
        function: 'Emulsifier, solubilizer, and moisture binder — assists ingredient blending and skin penetration',
        safetyLevel: 'CAUTION',
        concerns: [
            'Potential 1,4-dioxane contamination from ethoxylation (manufacturing concern)',
            'Can enhance penetration of other ingredients, including potentially harmful ones',
            'Environmental persistence',
        ],
        associatedRisks: ['Irritant', 'Pollutant'],
        scientificEvidence: 'PEGs themselves have low toxicity and are widely used in pharmaceuticals and cosmetics. The primary concern is potential contamination with 1,4-dioxane (a probable carcinogen) during the ethoxylation process. Modern purification methods have largely addressed this, and reputable manufacturers test for and remove 1,4-dioxane to negligible levels.\n\nPEGs can also increase skin permeability, which is beneficial for active delivery but could theoretically enhance absorption of irritants.',
        sources: ['CIR Expert Panel, 2010', 'FDA Guidance on 1,4-Dioxane in Cosmetics', 'SCCS Notes of Guidance'],
        alternatives: 'Plant-derived emulsifiers, glyceryl stearate, cetearyl olivate',
        exposureContext: 'Manufacturing quality determines safety. Lower molecular weight PEGs penetrate more. 1,4-dioxane risk is a QC issue.',
        regulatoryStatus: {
            EU: 'Permitted — 1,4-dioxane monitored as impurity',
            US: 'FDA — safe as used',
            UK: 'Permitted'
        }
    },

    // ===== OTHER COMMON INGREDIENTS =====
    'glycerin': {
        name: 'Glycerin (Glycerol)',
        aliases: ['glycerin', 'glycerol', 'glycerine', 'vegetable glycerin'],
        category: 'Humectant',
        function: 'Moisture-drawing humectant — attracts water from the environment and deeper skin layers',
        safetyLevel: 'SAFE',
        concerns: [],
        associatedRisks: [],
        scientificEvidence: 'Glycerin is one of the most well-established and safest humectants in skincare. It occurs naturally in the skin as part of the natural moisturizing factor (NMF). Studies demonstrate it improves skin hydration, accelerates wound healing, and strengthens the skin barrier. No safety concerns at any cosmetic concentration.',
        sources: ['CIR Expert Panel, 2019', 'Fluhr et al., Br J Dermatol, 2008'],
        alternatives: 'Hyaluronic acid, panthenol, propanediol (other humectants)',
        exposureContext: 'Safe for all product types, all concentrations, all skin types.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'FDA GRAS',
            UK: 'Permitted'
        }
    },

    'tocopherol': {
        name: 'Tocopherol (Vitamin E)',
        aliases: ['tocopherol', 'vitamin e', 'tocopheryl acetate', 'alpha-tocopherol'],
        category: 'Antioxidant',
        function: 'Antioxidant — protects formula from oxidation and provides skin conditioning benefits',
        safetyLevel: 'SAFE',
        concerns: [
            'Rare cases of contact dermatitis reported',
        ],
        associatedRisks: [],
        scientificEvidence: 'Vitamin E is a potent fat-soluble antioxidant with strong evidence for skin photoprotection and anti-inflammatory effects. It is commonly used both as an active ingredient and as a formula stabilizer. The CIR Expert Panel considers it safe as used in cosmetics.',
        sources: ['CIR Expert Panel, 2002 (reaffirmed)', 'Thiele et al., J Dermatol, 2005'],
        alternatives: 'Resveratrol, ferulic acid (other antioxidants)',
        exposureContext: 'Safe for all product types. Synergistic with vitamin C for enhanced photoprotection.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'cetearyl alcohol': {
        name: 'Cetearyl Alcohol',
        aliases: ['cetearyl alcohol', 'cetostearyl alcohol', 'cetyl stearyl alcohol'],
        category: 'Emollient / Emulsifier',
        function: 'Fatty alcohol — thickens formulations, stabilizes emulsions, and softens skin',
        safetyLevel: 'SAFE',
        concerns: [
            'Despite having "alcohol" in name, it is a fatty alcohol and not drying',
            'Rare contact sensitivity reported',
        ],
        associatedRisks: [],
        scientificEvidence: 'Cetearyl alcohol is a mixture of cetyl and stearyl alcohols (long-chain fatty alcohols). Unlike ethanol or isopropyl alcohol, fatty alcohols are emollient and conditioning. They do not dry the skin. CIR Expert Panel and SCCS confirm safety. Very rare cases of contact allergy have been reported.',
        sources: ['CIR Expert Panel, 1988 (reaffirmed)', 'SCCS Notes of Guidance'],
        alternatives: 'Behenyl alcohol, stearic acid',
        exposureContext: 'Safe for all product types including sensitive skin formulations.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'panthenol': {
        name: 'Panthenol (Provitamin B5)',
        aliases: ['panthenol', 'dexpanthenol', 'd-panthenol', 'provitamin b5', 'pantothenol'],
        category: 'Active — Skin Conditioning',
        function: 'Provitamin — converts to pantothenic acid (B5) in skin, improving hydration and barrier repair',
        safetyLevel: 'SAFE',
        concerns: [],
        associatedRisks: [],
        scientificEvidence: 'Panthenol is widely used in both cosmetics and pharmaceuticals for its wound-healing and moisturizing properties. Clinical studies confirm it improves skin hydration, reduces transepidermal water loss, and accelerates wound healing. It is one of the safest and most well-tolerated cosmetic actives.',
        sources: ['Ebner et al., Am J Clin Dermatol, 2002', 'CIR Expert Panel, 2017'],
        alternatives: 'Allantoin, bisabolol (other soothing agents)',
        exposureContext: 'Safe for all products including baby care, wound care, and lip products.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'triclosan': {
        name: 'Triclosan',
        aliases: ['triclosan', 'irgasan', '5-chloro-2-(2,4-dichlorophenoxy)phenol'],
        category: 'Antimicrobial / Preservative',
        function: 'Antibacterial agent — inhibits bacterial growth',
        safetyLevel: 'AVOID',
        concerns: [
            'Endocrine disruptor — affects thyroid and reproductive hormones',
            'Contributes to antimicrobial resistance',
            'Persistent environmental pollutant',
            'FDA banned in antibacterial hand soaps (2016)',
        ],
        associatedRisks: ['Potential endocrine disruptor', 'Pollutant'],
        scientificEvidence: 'The FDA issued a final rule in 2016 banning triclosan from over-the-counter antiseptic wash products, concluding that manufacturers failed to demonstrate it is safe for long-term daily use or more effective than plain soap. The EU restricted its use in cosmetics to toothpaste (max 0.3%) and mouthwash only.\n\nStudies link triclosan to thyroid disruption, antibiotic resistance development, and aquatic ecosystem harm.',
        sources: ['FDA Final Rule, 2016', 'EU Commission Regulation 2014/358', 'Weatherly & Gosse, Toxicol Sci, 2017'],
        alternatives: 'Benzalkonium chloride (limited use), adequate preservation systems',
        exposureContext: 'Banned in most wash-off products. Only permitted in EU toothpaste. No cosmetic use justified.',
        regulatoryStatus: {
            EU: 'Only in toothpaste/mouthwash ≤0.3%',
            US: 'Banned in antiseptic washes; still in some toothpaste',
            UK: 'Only in toothpaste/mouthwash ≤0.3%'
        },
        ageRestrictions: {
            infant: 'CRITICAL',
            toddler: 'AVOID',
            pregnancy: 'AVOID'
        }
    },

    'ethylhexyl methoxycinnamate': {
        name: 'Ethylhexyl Methoxycinnamate (Octinoxate)',
        aliases: ['ethylhexyl methoxycinnamate', 'octinoxate', 'octyl methoxycinnamate', 'omc'],
        category: 'UV Filter — Chemical Sunscreen',
        function: 'UVB absorber — protects skin from sunburn-causing rays',
        safetyLevel: 'CAUTION',
        concerns: [
            'Estrogenic activity demonstrated in multiple studies',
            'Coral reef toxicity — banned in Hawaii along with oxybenzone',
            'Photo-unstable — degrades under UV exposure',
        ],
        associatedRisks: ['Potential endocrine disruptor', 'Pollutant'],
        scientificEvidence: 'Octinoxate is the most widely used UVB filter globally. Concerns include estrogenic activity in vitro and in vivo, and environmental impact on marine ecosystems. The SCCS evaluated it in 2020 and maintained its acceptable limit at 10% but noted ongoing endocrine concerns.\n\nIts photo-instability means it degrades during sun exposure, reducing protection over time unless stabilized with other UV filters.',
        sources: ['SCCS Opinion, 2020', 'Krause et al., Int J Androl, 2012', 'Hawaii Act 104 (2018)'],
        alternatives: 'Zinc oxide, tinosorb S, uvinul A+',
        exposureContext: 'Leave-on product with repeated application. Photo-degradation reduces efficacy over time.',
        regulatoryStatus: {
            EU: 'Permitted up to 10%',
            US: 'FDA approved sunscreen agent',
            UK: 'Permitted up to 10%'
        }
    },

    'cocamidopropyl betaine': {
        name: 'Cocamidopropyl Betaine',
        aliases: ['cocamidopropyl betaine', 'capb', 'coco betaine'],
        category: 'Surfactant — Amphoteric',
        function: 'Mild cleansing agent and foam booster — derived from coconut oil',
        safetyLevel: 'SAFE',
        concerns: [
            'Rare sensitization reported (often due to impurities rather than the ingredient itself)',
        ],
        associatedRisks: [],
        scientificEvidence: 'Cocamidopropyl betaine is a mild amphoteric surfactant commonly used in baby shampoos and sensitive-skin cleansers. The American Contact Dermatitis Society named it "Allergen of the Year" in 2004, but subsequent research attributed most reactions to impurities (amidoamine, dimethylaminopropylamine) rather than CAPB itself. Purified CAPB has a very low sensitization rate.',
        sources: ['CIR Expert Panel, 2012', 'ACDS Allergen of the Year, 2004', 'Jacob & Amini, Dermatitis, 2008'],
        alternatives: 'Disodium cocoyl glutamate, decyl glucoside',
        exposureContext: 'Well-tolerated in rinse-off products. Used in baby and sensitive-skin formulations.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Safe as used',
            UK: 'Permitted'
        }
    },

    'butylphenyl methylpropional': {
        name: 'Butylphenyl Methylpropional (Lilial)',
        aliases: ['butylphenyl methylpropional', 'lilial', 'bmhca', 'lysmeral'],
        category: 'Fragrance',
        function: 'Synthetic fragrance ingredient — provides lily-of-the-valley scent',
        safetyLevel: 'AVOID',
        concerns: [
            'Classified as reprotoxic (Category 1B) under EU CLP Regulation',
            'Banned in EU cosmetics since March 2022',
            'Skin sensitizer (fragrance allergen)',
        ],
        associatedRisks: ['Potential endocrine disruptor', 'Potential allergen'],
        scientificEvidence: 'Lilial was banned in EU cosmetics (Regulation 2021/1902) effective March 2022 after its classification as reprotoxic Category 1B, meaning it is presumed to impair human fertility or cause developmental toxicity. Products containing Lilial may no longer be sold in the EU/UK.\n\nThis is a landmark regulatory action demonstrating that well-known fragrance ingredients can be removed from the market based on updated toxicological assessment.',
        sources: ['EU Regulation 2021/1902', 'CLP Regulation — Reprotoxic Cat 1B', 'SCCS Opinion'],
        alternatives: 'Other floral synthetic fragrances without reprotoxic classification',
        exposureContext: 'Banned substance — should not be present in any product sold in EU/UK. If found, the product is non-compliant.',
        regulatoryStatus: {
            EU: 'BANNED since March 2022',
            US: 'Not specifically restricted',
            UK: 'BANNED since March 2022'
        },
        ageRestrictions: {
            pregnancy: 'CRITICAL',
            infant: 'CRITICAL'
        }
    },

    'methyl salicylate': {
        name: 'Methyl Salicylate',
        aliases: ['methyl salicylate', 'oil of wintergreen', 'wintergreen oil'],
        category: 'Fragrance Allergen',
        function: 'Fragrance component — provides a minty/wintergreen scent; also used as a counter-irritant',
        safetyLevel: 'CAUTION',
        concerns: [
            'EU-listed established contact allergen (SCCS)',
            'Toxic if ingested — particularly dangerous for children',
            'Must be declared on labels from August 2026',
        ],
        associatedRisks: ['Potential allergen'],
        scientificEvidence: 'This fragrant substance is considered by the SCCS (Scientific Committee on Consumer Safety) to be an "established contact allergen in humans." As of August 2023, in the European Union, it must be mandatorily mentioned on the label for concentrations exceeding 0.001% in leave-on products and 0.01% in rinse-off products. A transition period has been granted by the European Commission. By August 2028, all products not complying with this new requirement should be removed from the market.\n\nIn other countries, such as the United States, Canada, or Australia, this substance may not necessarily be listed in the ingredients. It can be grouped with other components under the term "fragrance."',
        sources: ['2012, SCCS - Opinion on fragrance allergens in cosmetics', '2012, SCCS - Table 13-1: Established contact allergens in humans', 'EU Cosmetics Regulation Annex III (updated 2023)'],
        alternatives: 'Non-minty fragrance alternatives',
        exposureContext: 'Must be declared in EU above thresholds. Ingestion toxicity means lip products require careful formulation.',
        regulatoryStatus: {
            EU: 'Mandatory declaration from 2026; transition until 2028',
            US: 'No specific cosmetic disclosure requirement',
            UK: 'Mandatory declaration (aligned with EU)'
        }
    },

    'alcohol denat': {
        name: 'Alcohol Denat (Denatured Alcohol)',
        aliases: ['alcohol denat', 'denatured alcohol', 'sd alcohol', 'ethanol', 'alcohol'],
        category: 'Solvent / Astringent',
        function: 'Solvent — aids ingredient dissolution, provides quick-drying finish, enhances penetration of actives',
        safetyLevel: 'CAUTION',
        concerns: [
            'Can be drying and irritating with prolonged use, especially on dry/sensitive skin',
            'Disrupts skin barrier when used in high concentrations',
            'Antimicrobial properties can alter skin microbiome',
        ],
        associatedRisks: ['Irritant'],
        scientificEvidence: 'Short-chain alcohols like ethanol (alcohol denat.) serve important formulation functions but can disrupt the skin barrier when used at high concentrations in leave-on products. The position in the ingredient list indicates concentration — if listed in the first 5 ingredients, significant skin-drying effects are likely. When listed lower, it typically serves as a solvent for other actives and has minimal drying effect.',
        sources: ['CIR Expert Panel', 'Lachenmeier, Int J Environ Res Public Health, 2008'],
        alternatives: 'Propanediol, ethoxydiglycol (alternative solvents)',
        exposureContext: 'Concentration matters greatly. High concentration in leave-on products = more drying. Low concentration or rinse-off = minimal concern.',
        regulatoryStatus: {
            EU: 'Permitted',
            US: 'Permitted',
            UK: 'Permitted'
        }
    },
};

/**
 * Search ingredient database by name or E-number
 * @param {string} query - Ingredient name or E-number
 * @returns {object|null} Ingredient data or null if not found
 */
export function getIngredientInfo(query) {
    if (!query) return null;

    const searchTerm = query.toLowerCase().trim();

    // Direct E-number match
    if (INGREDIENT_DATABASE[searchTerm]) {
        return INGREDIENT_DATABASE[searchTerm];
    }

    // Search by name or alias
    for (const [key, data] of Object.entries(INGREDIENT_DATABASE)) {
        if (data.name.toLowerCase().includes(searchTerm)) {
            return data;
        }

        if (data.aliases && data.aliases.some(alias =>
            alias.toLowerCase().includes(searchTerm)
        )) {
            return data;
        }
    }

    return null;
}

/**
 * Get all ingredients of a specific safety level
 * @param {string} safetyLevel - 'SAFE' | 'CAUTION' | 'AVOID' | 'CRITICAL'
 * @returns {array} List of ingredients
 */
export function getIngredientsBySafetyLevel(safetyLevel) {
    return Object.entries(INGREDIENT_DATABASE)
        .filter(([_, data]) => data.safetyLevel === safetyLevel)
        .map(([key, data]) => ({ code: key, ...data }));
}

/**
 * Check if ingredient has age-specific restrictions
 * @param {string} ingredientCode - E-number or ingredient name
 * @param {string} ageGroup - Age group to check
 * @returns {string|null} Restriction level or null
 */
export function getAgeRestriction(ingredientCode, ageGroup) {
    const info = getIngredientInfo(ingredientCode);
    if (!info || !info.ageRestrictions) return null;
    return info.ageRestrictions[ageGroup] || null;
}
