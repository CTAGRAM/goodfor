# GoodFor Beauty Product Algorithm - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Product Detection & Classification](#product-detection--classification)
4. [Safety Analysis Engine](#safety-analysis-engine)
5. [Scoring System](#scoring-system)
6. [Age-Based Restrictions](#age-based-restrictions)
7. [Pregnancy & Breastfeeding Restrictions](#pregnancy--breastfeeding-restrictions)
8. [EU Fragrance Allergens System](#eu-fragrance-allergens-system)
9. [Ingredient Concern Categories](#ingredient-concern-categories)
10. [Sunscreen-Specific Analysis](#sunscreen-specific-analysis)
11. [Beauty Alternatives Algorithm](#beauty-alternatives-algorithm)
12. [UI Display Logic](#ui-display-logic)
13. [Complete Calculation Examples](#complete-calculation-examples)

---

## Overview

The GoodFor Beauty Algorithm analyzes cosmetic and personal care products using a multi-layered safety assessment system that considers:

- **EU Cosmetics Regulation 1223/2009** compliance
- **Age-specific ingredient restrictions** (infants, children, adults)
- **Pregnancy/breastfeeding safety** considerations
- **EU 26 mandatory fragrance allergen** detection
- **General ingredient concerns** (formaldehyde, parabens, phthalates, etc.)
- **Sunscreen-specific rules** (mineral vs. chemical filters)

### Key Differences from Food Algorithm

| Aspect | Food Products | Beauty Products |
|--------|---------------|-----------------|
| **Primary Data Source** | OpenFoodFacts | OpenBeautyFacts |
| **Base Scoring** | Nutri-Score (A-E) | Issue-based deductions |
| **Starting Score** | Varies (40-100) | Always 100 |
| **Key Concerns** | Nutrition, additives | Sensitizers, allergens, age-safety |
| **Regulatory Framework** | EU Food Labeling | EU Cosmetics Reg. 1223/2009 |

### Final Score Range
- **80-100**: Safe (Green) ✅
- **40-79**: Use with Caution (Yellow) ⚠️
- **0-39**: Avoid (Red) ❌

---

## Data Sources

### Primary: OpenBeautyFacts API

**Endpoint**: `https://world.openbeautyfacts.org/api/v2`

**Rate Limit**: 100 requests/minute (600ms minimum interval)

**Product Lookup**:
```javascript
GET /product/{barcode}.json
```

**Search Endpoint**:
```javascript
GET /search?search_terms={query}&page_size=20
```

### Data Fields Retrieved

| Field | Description | Usage |
|-------|-------------|-------|
| `code` | Product barcode | Unique identifier |
| `product_name` | Product name | Display |
| `brands` | Brand name | Display |
| `categories_tags` | Product categories | Classification |
| `ingredients_text` | Raw ingredient list | Safety analysis |
| `image_url` | Product image | Display |
| `labels_tags` | Certifications | Organic, Vegan detection |

### Authoritative References

1. **EU Cosmetics Regulation 1223/2009** - Primary safety standards
2. **CIR (Cosmetic Ingredient Review)** - Ingredient safety assessments
3. **FDA Cosmetics Guidance** - US safety recommendations
4. **AAP (American Academy of Pediatrics)** - Infant skincare guidelines
5. **EU 26 Fragrance Allergens** - Mandatory disclosure requirements

---

## Product Detection & Classification

### Product Type Detection

```javascript
function determineCosmeticSubtype(categories) {
    if (matches: sunscreen, spf, sun protection) → 'SUNSCREEN'
    if (matches: skin care, face care, moisturizer) → 'SKINCARE'
    if (matches: hair, shampoo, conditioner) → 'HAIRCARE'
    if (matches: makeup, foundation, mascara) → 'MAKEUP'
    if (matches: deodorant, antiperspirant) → 'DEODORANT'
    if (matches: soap, body wash, shower gel) → 'BODY_CARE'
    if (matches: perfume, eau de, cologne) → 'FRAGRANCE'
    if (matches: toothpaste, mouthwash, dental) → 'ORAL_CARE'
    else → 'OTHER'
}
```

### Beauty Product Indicators

The system identifies beauty products via:

1. **Source API**: Fetched from OpenBeautyFacts (not OpenFoodFacts)
2. **productType Field**: Set to `'BEAUTY'`
3. **Barcode Heuristics**: Certain manufacturer prefixes suggest cosmetics

**Manufacturer Prefix Heuristics**:
```javascript
const beautyPrefixes = [
    '301', '302', '303',  // L'Oréal
    '304', '305',          // Unilever personal care
    '360',                 // Johnson & Johnson
    '890',                 // Korean cosmetics (K-beauty)
    '880',                 // Japanese cosmetics
    '871',                 // Netherlands personal care
];
```

---

## Safety Analysis Engine

### Analysis Flow

```
Product Data (OpenBeautyFacts)
        ↓
┌─────────────────────────────────────────────┐
│ 1. Extract & Normalize Ingredients          │
│    - Parse ingredients_text                 │
│    - Normalize to lowercase                 │
│    - Extract individual ingredient names    │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 2. Sunscreen-Specific Checks (if applicable)│
│    - Age < 6mo: Avoid all sunscreen         │
│    - Age < 3y: Prefer mineral only          │
│    - Check chemical filter presence         │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 3. Infant Restrictions (age < 36 months)    │
│    - Fragrances (CRITICAL for < 12mo)       │
│    - Essential oils with 1,8-cineole        │
│    - Parabens, Sulfates, Talc, Alcohol      │
│    - Phenoxyethanol                         │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 4. Pregnancy Restrictions (if applicable)   │
│    - Retinoids (CRITICAL)                   │
│    - Salicylic Acid, Hydroquinone           │
│    - Formaldehyde releasers                 │
│    - Chemical sunscreen filters             │
│    - Phthalates                             │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 5. General Ingredient Restrictions (ALL ages)│
│    - Formaldehyde (CRITICAL)                │
│    - Formaldehyde releasers (AVOID)         │
│    - Parabens (CAUTION)                     │
│    - Sulfates (CAUTION)                     │
│    - Oxybenzone (CAUTION)                   │
│    - Triclosan, Hydroquinone (AVOID)        │
│    - Phthalates (AVOID)                     │
│    - Toluene, Coal tar (CAUTION)            │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 6. EU 26 Fragrance Allergen Detection       │
│    - Check all 26 mandatory allergens       │
│    - Flag banned substances (LYRAL, LILIAL) │
│    - Age-adjusted severity                  │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 7. Generic Fragrance Check (babies only)    │
│    - Any parfum/fragrance/aroma flagged     │
│    - CRITICAL for < 12 months               │
│    - AVOID for 12-36 months                 │
└─────────────────────────────────────────────┘
        ↓
Calculate Overall Safety Level & Score
        ↓
Return Safety Analysis Result
```

---

## Scoring System

### Base Score Calculation

Unlike food products (which start from Nutri-Score), cosmetics always start at **100** and deduct for issues:

```javascript
function calculateCosmeticSafeScore(issues) {
    let score = 100;  // Start perfect
    
    // Count issues by severity
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const avoidCount = issues.filter(i => i.severity === 'AVOID').length;
    const cautionCount = issues.filter(i => i.severity === 'CAUTION').length;
    
    // Apply penalties with diminishing returns
    // ... (see below)
    
    return Math.max(0, Math.min(100, Math.round(score)));
}
```

### Penalty Structure

| Severity | First Issue | Additional Issues (each) |
|----------|-------------|--------------------------|
| **CRITICAL** | -40 points | -20 points |
| **AVOID** | -25 points | -12 points |
| **CAUTION** | -10 points | -5 points |

**Penalty Calculation**:
```javascript
// CRITICAL penalties
if (criticalCount > 0) {
    score -= 40;  // First CRITICAL
    if (criticalCount > 1) {
        score -= (criticalCount - 1) * 20;  // Additional CRITICAL
    }
}

// AVOID penalties
if (avoidCount > 0) {
    score -= 25;  // First AVOID
    if (avoidCount > 1) {
        score -= (avoidCount - 1) * 12;  // Additional AVOID
    }
}

// CAUTION penalties
if (cautionCount > 0) {
    score -= 10;  // First CAUTION
    if (cautionCount > 1) {
        score -= (cautionCount - 1) * 5;  // Additional CAUTION
    }
}
```

### Hard Caps

```javascript
// 2+ CRITICAL issues = Maximum score 15
if (criticalCount >= 2) {
    score = Math.min(score, 15);
}
```

### Score Examples

| Issues Detected | Calculation | Final Score |
|-----------------|-------------|-------------|
| 0 issues | 100 - 0 | **100** ✅ |
| 1 CAUTION | 100 - 10 | **90** ✅ |
| 2 CAUTION | 100 - 10 - 5 | **85** ✅ |
| 1 AVOID | 100 - 25 | **75** ⚠️ |
| 1 CRITICAL | 100 - 40 | **60** ⚠️ |
| 1 CRITICAL + 2 CAUTION | 100 - 40 - 10 - 5 | **45** ⚠️ |
| 2 CRITICAL | 100 - 40 - 20 → capped to 15 | **15** ❌ |
| 1 AVOID + 1 CAUTION | 100 - 25 - 10 | **65** ⚠️ |

---

## Age-Based Restrictions

### Age Bracket Definitions

| Bracket | Age Range | Months | Safety Level |
|---------|-----------|--------|--------------|
| **Infant (Pre-weaning)** | 0-6 months | 0-6 | Strictest |
| **Infant (Post-weaning)** | 6-12 months | 6-12 | Very Strict |
| **Toddler** | 1-3 years | 12-36 | Strict |
| **Child** | 4-12 years | 36-144 | Moderate |
| **Adult** | 18+ years | 216+ | Standard |

### Infant Restrictions (< 36 months)

| Ingredient Category | Patterns | Severity | Applies Until |
|---------------------|----------|----------|---------------|
| **Synthetic Fragrances** | parfum, fragrance, aroma, perfume | CRITICAL | 12 months |
| **Essential oils (1,8-cineole)** | eucalyptus, rosemary, peppermint, camphor | CRITICAL | 36 months |
| **Parabens** | methylparaben, propylparaben, butylparaben | CAUTION | 36 months |
| **Sulfates** | sodium lauryl sulfate, SLS, SLES | AVOID | 36 months |
| **Talc** | talc, talcum | AVOID | 36 months |
| **Drying Alcohols** | alcohol denat, SD alcohol, isopropyl alcohol | CAUTION | 12 months |
| **Phenoxyethanol** | phenoxyethanol | CAUTION | 36 months |

### Restriction Check Algorithm

```javascript
if (ageMonths < 36) {
    for (const restriction of INFANT_RESTRICTIONS) {
        // Skip if age exceeds restriction's max age
        if (restriction.ageMax && ageMonths > restriction.ageMax) continue;
        
        for (const pattern of restriction.patterns) {
            const matches = ingredients.filter(ing => pattern.test(ing));
            if (matches.length > 0) {
                issues.push({
                    name: matches[0].toUpperCase(),
                    severity: restriction.severity,
                    reason: restriction.reason,
                    type: 'AGE_RESTRICTION',
                });
                break;  // Only add once per restriction category
            }
        }
    }
}
```

---

## Pregnancy & Breastfeeding Restrictions

### Critical Restrictions

| Ingredient | Severity | Reason |
|------------|----------|--------|
| **Retinoids** (retinol, tretinoin, adapalene) | CRITICAL | Linked to birth defects |
| **Salicylic Acid** (>2%, BHA) | AVOID | High-dose not recommended |
| **Hydroquinone** | AVOID | High systemic absorption |
| **Formaldehyde releasers** | AVOID | Carcinogen with pregnancy concerns |
| **Chemical sunscreen filters** | CAUTION | Endocrine disruption concerns |
| **Phthalates** (DBP, DEHP) | AVOID | Developmental concerns |

### Implementation

```javascript
if (isPregnant || isBreastfeeding) {
    for (const restriction of PREGNANCY_RESTRICTIONS) {
        for (const pattern of restriction.patterns) {
            const matches = ingredients.filter(ing => pattern.test(ing));
            if (matches.length > 0) {
                issues.push({
                    name: matches[0].toUpperCase(),
                    severity: restriction.severity,
                    reason: restriction.reason + 
                        (isBreastfeeding ? ' (also avoid while breastfeeding)' : ''),
                    type: 'PREGNANCY_RESTRICTION',
                });
                break;
            }
        }
    }
}
```

---

## EU Fragrance Allergens System

### EU 26 Mandatory Fragrance Allergens

Per **EU Regulation 1223/2009**, these 26 allergens must be labeled when present above:
- **Leave-on products**: 0.001% (10 ppm)
- **Rinse-off products**: 0.01% (100 ppm)

### Complete Allergen List

| INCI Name | CAS Number | Category | Common Sources |
|-----------|------------|----------|----------------|
| AMYL CINNAMAL | 122-40-7 | Aldehyde | Jasmine fragrances |
| BENZYL ALCOHOL | 100-51-6 | Alcohol | Jasmine, hyacinth |
| CINNAMYL ALCOHOL | 104-54-1 | Alcohol | Cinnamon, balsams |
| CITRAL | 5392-40-5 | Aldehyde | Lemongrass, citrus oils |
| EUGENOL | 97-53-0 | Phenol | Clove oil, cinnamon |
| HYDROXYCITRONELLAL | 107-75-5 | Aldehyde | Lily of the valley |
| ISOEUGENOL | 97-54-1 | Phenol | Ylang-ylang, clove |
| AMYLCINNAMYL ALCOHOL | 101-85-9 | Alcohol | Synthetic fragrances |
| BENZYL SALICYLATE | 118-58-1 | Ester | Balsam, carnation |
| CINNAMAL | 104-55-2 | Aldehyde | Cinnamon bark oil |
| COUMARIN | 91-64-5 | Lactone | Tonka bean, lavender |
| GERANIOL | 106-24-1 | Terpene | Rose, geranium |
| ANISE ALCOHOL | 105-13-5 | Alcohol | Anise |
| BENZYL CINNAMATE | 103-41-3 | Ester | Balsam of Peru/Tolu |
| FARNESOL | 4602-84-0 | Terpene | Chamomile, florals |
| LINALOOL | 78-70-6 | Terpene | Lavender, bergamot |
| BENZYL BENZOATE | 120-51-4 | Ester | Jasmine, ylang-ylang |
| CITRONELLOL | 106-22-9 | Terpene | Rose, citronella |
| HEXYL CINNAMAL | 101-86-0 | Aldehyde | Chamomile, jasmine |
| LIMONENE | 5989-27-5 | Terpene | Citrus peel oils |
| METHYL 2-OCTYNOATE | 111-12-6 | Ester | Violet fragrances |
| ALPHA-ISOMETHYL IONONE | 127-51-5 | Ketone | Violet, orris root |
| EVERNIA PRUNASTRI | 90028-68-5 | Natural | Oak moss (chypre perfumes) |
| EVERNIA FURFURACEA | 90028-67-4 | Natural | Tree moss |

### Banned Allergens

| INCI Name | CAS | Ban Date | Reason |
|-----------|-----|----------|--------|
| **BUTYLPHENYL METHYLPROPIONAL** (Lilial) | 80-54-6 | 2022-03-01 | Reproductive toxicity |
| **HYDROXYISOHEXYL 3-CYCLOHEXENE CARBOXALDEHYDE** (Lyral) | 31906-04-4 | 2021-08-23 | High sensitization |

### Allergen Detection Algorithm

```javascript
function checkFragranceAllergens(ingredients, ageMonths) {
    const detected = [];
    
    for (const allergen of EU_26_FRAGRANCE_ALLERGENS) {
        // Check INCI name
        let found = ingredients.some(ing => 
            ing.includes(allergen.inci.toLowerCase())
        );
        
        // Check aliases
        if (!found && allergen.aliases) {
            found = allergen.aliases.some(alias =>
                ingredients.some(ing => ing.includes(alias.toLowerCase()))
            );
        }
        
        if (found) {
            let severity = 'CAUTION';
            let reason = 'EU-regulated fragrance allergen';
            
            // Banned substances
            if (allergen.banned) {
                severity = 'CRITICAL';
                reason = `BANNED in EU since ${allergen.banDate}`;
            }
            // Stricter for infants/toddlers
            else if (ageMonths < 12) {
                severity = 'CRITICAL';
            }
            else if (ageMonths < 36) {
                severity = 'AVOID';
            }
            
            detected.push({
                name: allergen.inci,
                casNumber: allergen.casNumber,
                severity,
                reason,
                isBanned: allergen.banned || false,
            });
        }
    }
    
    return detected;
}
```

### Age-Adjusted Allergen Severity

| Age Group | Default Severity | Banned Substances |
|-----------|------------------|-------------------|
| Adults (18+) | CAUTION | CRITICAL |
| Children (3-18y) | CAUTION | CRITICAL |
| Toddlers (1-3y) | AVOID | CRITICAL |
| Infants (<1y) | CRITICAL | CRITICAL |

---

## Ingredient Concern Categories

### General Restrictions (ALL Ages)

These ingredients are flagged regardless of user age:

| Category | Ingredients | Severity | Reason |
|----------|-------------|----------|--------|
| **Carcinogens** | Formaldehyde, Formalin | CRITICAL | IARC Group 1 carcinogen, banned in EU |
| **Formaldehyde Releasers** | DMDM Hydantoin, Imidazolidinyl Urea, Quaternium-15, Bronopol | AVOID | Release formaldehyde over time |
| **Parabens** | Propylparaben, Butylparaben | CAUTION | Weak estrogenic activity |
| **Sulfates** | Sodium Lauryl Sulfate (SLS) | CAUTION | Drying, potentially irritating |
| **Chemical Sunscreens** | Oxybenzone, Benzophenone-3 | CAUTION | Hormone disruption, reef damage |
| **Coal Tar** | Coal tar, CI dyes | CAUTION | Carcinogenic impurities |
| **Triclosan** | Triclosan | AVOID | Endocrine disruptor, banned in soaps |
| **Hydroquinone** | Hydroquinone | AVOID | Banned in EU (except Rx) |
| **Solvents** | Toluene | CAUTION | Neurotoxicity concerns |
| **Phthalates** | DBP, DEHP, Dibutyl phthalate | AVOID | Reproductive toxicity |

### Implementation

```javascript
const GENERAL_RESTRICTIONS = [
    {
        patterns: [/formaldehyde/i, /formalin/i],
        severity: 'CRITICAL',
        reason: 'Known human carcinogen (IARC Group 1) - banned in EU cosmetics',
    },
    {
        patterns: [/dmdm hydantoin/i, /imidazolidinyl urea/i, /quaternium-15/i, /bronopol/i],
        severity: 'AVOID',
        reason: 'Formaldehyde-releasing preservative - may cause sensitization',
    },
    // ... (10 total categories)
];

// Check for ALL ages
for (const restriction of GENERAL_RESTRICTIONS) {
    for (const pattern of restriction.patterns) {
        if (ingredients.some(ing => pattern.test(ing))) {
            issues.push({
                name: matchedIngredient.toUpperCase(),
                severity: restriction.severity,
                reason: restriction.reason,
                type: 'INGREDIENT_CONCERN',
            });
            break;
        }
    }
}
```

---

## Sunscreen-Specific Analysis

### Special Rules

#### Under 6 Months
**AAP Recommendation**: Avoid sunscreen entirely. Use physical protection (shade, hats, clothing).

```javascript
if (ageMonths < 6 && productSubtype === 'SUNSCREEN') {
    issues.push({
        name: 'Sunscreen Under 6 Months',
        severity: 'AVOID',
        reason: 'AAP recommends avoiding sunscreen for infants under 6 months',
        type: 'AGE_RESTRICTION',
    });
}
```

#### Under 3 Years (6-36 months)
**Recommendation**: Mineral (physical) sunscreens only - Zinc Oxide, Titanium Dioxide

**Chemical Filters to Avoid**:

| Filter | Severity | Reason |
|--------|----------|--------|
| **Oxybenzone** | AVOID | Hormone disruption, coral reef damage |
| **Octinoxate** | CAUTION | Endocrine disruption concerns |
| **Avobenzone** | CAUTION | Degrades in sun, needs stabilizers |
| **Homosalate** | CAUTION | Potential hormone effects |
| **Octocrylene** | CAUTION | Allergen, degrades to benzophenone |

```javascript
function checkSunscreenIngredients(ingredients, issues) {
    const hasMineral = ingredients.some(ing =>
        /zinc oxide/i.test(ing) || /titanium dioxide/i.test(ing)
    );
    
    // Flag chemical filters
    for (const chemFilter of SUNSCREEN_RULES.mineralOnly.avoidIngredients) {
        if (ingredients.some(ing => chemFilter.pattern.test(ing))) {
            issues.push({
                name: chemFilter.name,
                severity: chemFilter.severity,
                reason: chemFilter.reason + '. Mineral preferred for infants.',
                type: 'SUNSCREEN_FILTER',
            });
        }
    }
    
    // Warn if no mineral filter present
    if (!hasMineral) {
        issues.push({
            name: 'No Mineral UV Filter',
            severity: 'CAUTION',
            reason: 'Mineral sunscreens recommended for children',
            type: 'SUNSCREEN_FILTER',
        });
    }
}
```

---

## Beauty Alternatives Algorithm

### Overview

Finds safer/cleaner alternatives to scanned beauty products using OpenBeautyFacts.

### Search Strategy

```javascript
async function getBeautyAlternatives(product, limit = 5) {
    // 1. Extract search terms from product category
    const category = product.productSubtype || product.categories?.[0];
    const searchTerm = category
        .replace(/en:/g, '')
        .replace(/-/g, ' ')
        .split(' ')
        .slice(0, 2)
        .join(' ');
    
    // 2. Search OpenBeautyFacts
    const response = await fetch(
        `${BASE_URL}/search?search_terms=${searchTerm}&page_size=20`
    );
    
    // 3. Filter & Score
    const products = data.products
        .filter(p => p.code !== product.barcode)  // Exclude original
        .filter(p => p.product_name?.length > 0)   // Has name
        .map(p => ({
            ...parseBeautyProduct(p),
            safetyScore: calculateBeautyAlternativeScore(p),
        }))
        .sort((a, b) => b.safetyScore - a.safetyScore)
        .slice(0, limit);
    
    return products;
}
```

### Alternative Scoring

```javascript
function calculateBeautyAlternativeScore(product) {
    let score = 80;  // Start at 80 (good default)
    
    const ingredientsText = (product.ingredientsText || '').toLowerCase();
    
    // Positive indicators (+)
    if (product.isOrganic) score += 5;
    if (product.isVegan) score += 3;
    if (product.isCrueltyFree) score += 3;
    
    // Negative indicators (-)
    const concerns = [
        { pattern: /formaldehyde/i, penalty: 20 },
        { pattern: /paraben/i, penalty: 10 },
        { pattern: /sodium lauryl sulfate/i, penalty: 5 },
        { pattern: /fragrance|parfum/i, penalty: 5 },
        { pattern: /oxybenzone/i, penalty: 10 },
        { pattern: /retinol|retinoid/i, penalty: 5 },
        { pattern: /phthalate/i, penalty: 15 },
    ];
    
    for (const concern of concerns) {
        if (concern.pattern.test(ingredientsText)) {
            score -= concern.penalty;
        }
    }
    
    // Data quality bonus
    if (ingredientsText.length > 50) score += 5;
    
    return Math.max(30, Math.min(100, score));
}
```

### Alternative Comparison Reasons

```javascript
function getBeautyReasons(altProduct, originalProduct) {
    const reasons = [];
    
    // Positive attributes
    if (altProduct.isOrganic && !originalProduct.isOrganic) {
        reasons.push('Certified organic');
    }
    if (altProduct.isVegan && !originalProduct.isVegan) {
        reasons.push('Vegan formulation');
    }
    if (altProduct.isCrueltyFree && !originalProduct.isCrueltyFree) {
        reasons.push('Cruelty-free');
    }
    
    // Ingredient improvements
    const altIng = (altProduct.ingredientsText || '').toLowerCase();
    const origIng = (originalProduct.ingredientsText || '').toLowerCase();
    
    if (!altIng.includes('paraben') && origIng.includes('paraben')) {
        reasons.push('Paraben-free');
    }
    if (!altIng.includes('sulfate') && origIng.includes('sulfate')) {
        reasons.push('Sulfate-free');
    }
    if (!altIng.includes('fragrance') && origIng.includes('fragrance')) {
        reasons.push('Fragrance-free');
    }
    
    // Fallback
    if (reasons.length === 0) {
        reasons.push('Cleaner ingredient profile');
        reasons.push('Better safety score');
    }
    
    return reasons.slice(0, 2);  // Return max 2 reasons
}
```

### Badge Assignment

| Position | Condition | Badge |
|----------|-----------|-------|
| First | Always | "Top Match" |
| Any | `isOrganic = true` | "Organic" |
| Any | `isVegan = true` | "Vegan" |
| Any | `isCrueltyFree = true` | "Cruelty-Free" |
| Default | None of above | "Alternative" |

---

## UI Display Logic

### Product Category Display

```javascript
function getCategory() {
    const isBeautyProduct = product.productType === 'BEAUTY' || 
                           safety.productType === 'BEAUTY';
    
    if (isBeautyProduct) {
        // Use subtype if available
        if (product.productSubtype) {
            const subtypes = {
                'SKINCARE': 'Skincare',
                'HAIRCARE': 'Hair Care',
                'SUNSCREEN': 'Sunscreen',
                'MAKEUP': 'Makeup',
                'BODY_CARE': 'Body Care',
                'DEODORANT': 'Deodorant',
                'FRAGRANCE': 'Fragrance',
                'ORAL_CARE': 'Oral Care',
            };
            return subtypes[product.productSubtype] || 'Beauty Product';
        }
        return 'Beauty Product';
    }
    
    // Food product fallback
    return product.categories?.[0] || 'Food Product';
}
```

### Score Breakdown Categories

#### For Beauty Products:

| Category | Max Points | Description |
|----------|------------|-------------|
| **Ingredient Safety** | 25 | Based on general ingredient concerns |
| **Fragrance Allergens** | 25 | EU 26 allergen detection |
| **Age Suitability** | 20 | Age-specific restrictions |
| **Pregnancy Safety** | 15 | Pregnancy/breastfeeding concerns |
| **Data Quality** | 15 | Ingredient list completeness |

#### Score Calculation per Category:

```javascript
if (isBeautyProduct) {
    const allIssues = safety.issues || [];
    
    // Filter by type
    const fragranceIssues = allIssues.filter(i => 
        i.type === 'FRAGRANCE_ALLERGEN' || i.type === 'FRAGRANCE'
    );
    const ageIssues = allIssues.filter(i => i.type === 'AGE_RESTRICTION');
    const pregnancyIssues = allIssues.filter(i => i.type === 'PREGNANCY_RESTRICTION');
    const otherIssues = allIssues.filter(i => 
        !['FRAGRANCE_ALLERGEN', 'FRAGRANCE', 'AGE_RESTRICTION', 'PREGNANCY_RESTRICTION']
            .includes(i.type)
    );
    
    // Calculate category scores
    const ingredientScore = Math.max(0, 100 - (otherIssues.length * 25));
    const fragranceScore = Math.max(0, 100 - (fragranceIssues.length * 20));
    const ageScore = ageIssues.length > 0 ? 30 : 100;
    const pregnancyScore = pregnancyIssues.length > 0 ? 40 : 100;
    const dataScore = product.ingredientsText?.length > 10 ? 100 : 50;
}
```

### Data Sources Modal

For beauty products, display:
- **Open Beauty Facts** - Open cosmetics database
- **EU Cosmetics Regulation 1223/2009** - Official EU safety standards
- **CIR Safety Assessments** - Cosmetic Ingredient Review
- **EU 26 Fragrance Allergens** - Mandatory disclosure allergens
- **Pediatric Dermatology Guidelines** - AAP, FDA infant safety

---

## Complete Calculation Examples

### Example 1: Adult Moisturizer (Clean Formula)

**Product**: Organic Face Cream  
**User**: Adult, 30 years (360 months)

**Ingredients**: `Aqua, Aloe Vera, Glycerin, Shea Butter, Jojoba Oil, Vitamin E`

**Analysis**:
```
1. Sunscreen check: Not a sunscreen ✓
2. Infant restrictions: Age > 36mo → Skip
3. Pregnancy restrictions: Not pregnant → Skip
4. General restrictions: None found
5. Fragrance allergens: None found
6. Generic fragrance: Age > 36mo → Skip

Issues: 0
Score: 100 - 0 = 100
Safety Level: SAFE ✅
```

---

### Example 2: Baby Lotion with Fragrances

**Product**: Baby Body Lotion  
**User**: Infant, 8 months

**Ingredients**: `Aqua, Mineral Oil, Parfum, Methylparaben, Limonene, Linalool`

**Analysis**:
```
1. Sunscreen check: Not sunscreen ✓
2. Infant restrictions (8 months):
   - PARFUM detected → CRITICAL (age < 12mo)
   - METHYLPARABEN detected → CAUTION (age < 36mo)
3. Pregnancy: N/A
4. General restrictions:
   - (Methylparaben falls under infant, not general for this age)
5. Fragrance allergens:
   - LIMONENE detected → CRITICAL (age < 12mo)
   - LINALOOL detected → CRITICAL (age < 12mo)
6. Generic fragrance:
   - Already flagged

Issues:
- PARFUM: CRITICAL (-40)
- METHYLPARABEN: CAUTION (-10)
- LIMONENE: CRITICAL (-20, second CRITICAL)
- LINALOOL: CRITICAL (-20, third CRITICAL)

Score: 100 - 40 - 10 - 20 - 20 = 10
Hard cap (3 CRITICAL): score = min(10, 15) = 10

Safety Level: CRITICAL ❌
Final Score: 10
```

---

### Example 3: Sunscreen for Toddler

**Product**: SPF 50 Sunscreen  
**User**: Toddler, 2 years (24 months)

**Ingredients**: `Zinc Oxide, Titanium Dioxide, Aloe Vera, Oxybenzone, Octinoxate`

**Analysis**:
```
1. Sunscreen check (age < 36 months):
   - Has mineral filters (Zinc Oxide, Titanium Dioxide) ✓
   - OXYBENZONE detected → AVOID
   - OCTINOXATE detected → CAUTION
2. Infant restrictions:
   - No parfum, parabens, etc.
3. Pregnancy: N/A
4. General restrictions:
   - OXYBENZONE → CAUTION (already flagged stricter as sunscreen)
5. Fragrance allergens: None
6. Generic fragrance: No parfum

Issues:
- OXYBENZONE (sunscreen filter): AVOID (-25)
- OCTINOXATE (sunscreen filter): CAUTION (-10)

Score: 100 - 25 - 10 = 65
Safety Level: CAUTION ⚠️
Final Score: 65

Recommendation: Use a mineral-only sunscreen without chemical filters
```

---

### Example 4: Pregnancy-Safe Serum Check

**Product**: Anti-Aging Face Serum  
**User**: Adult, pregnant

**Ingredients**: `Aqua, Retinol, Niacinamide, Hyaluronic Acid, Salicylic Acid, Vitamin C`

**Analysis**:
```
1. Sunscreen: Not sunscreen ✓
2. Infant restrictions: Age > 36mo → Skip
3. Pregnancy restrictions (isPregnant = true):
   - RETINOL detected → CRITICAL
   - SALICYLIC ACID detected → AVOID
4. General restrictions: None flagged beyond pregnancy
5. Fragrance allergens: None
6. Generic fragrance: Age > 36mo → Skip

Issues:
- RETINOL: CRITICAL (-40)
- SALICYLIC ACID: AVOID (-25)

Score: 100 - 40 - 25 = 35
Safety Level: AVOID ❌
Final Score: 35

Recommendation: Avoid this product during pregnancy. Switch to pregnancy-safe alternatives.
```

---

## Summary

The GoodFor Beauty Algorithm provides comprehensive safety analysis for cosmetic products by:

1. **Starting at 100 points** (no base nutritional score like food)
2. **Checking multiple restriction layers** in order of severity
3. **Applying age-appropriate rules** (strictest for infants)
4. **Detecting EU-regulated allergens** with ban status awareness
5. **Flagging general ingredient concerns** for all ages
6. **Providing specialized sunscreen analysis** for children
7. **Finding cleaner alternatives** based on ingredient profiles

The algorithm prioritizes **precautionary safety**, especially for vulnerable populations (infants, pregnant women), while providing actionable information for adults to make informed choices.
