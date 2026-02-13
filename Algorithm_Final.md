# GoodFor Algorithm Calculation System - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Scoring System](#core-scoring-system)
3. [Nutri-Score Algorithm](#nutri-score-algorithm)
4. [Safety Analysis Engine](#safety-analysis-engine)
5. [Personalization System](#personalization-system)
6. [Age-Based Restrictions](#age-based-restrictions)
7. [Environmental & Processing Scores](#environmental--processing-scores)
8. [AI Integration](#ai-integration)
9. [Product Alternatives Algorithm](#product-alternatives-algorithm)
10. [Data Flow](#data-flow)
11. [Calculation Examples](#calculation-examples)

---

## Overview

The GoodFor algorithm is a comprehensive product safety and nutrition analysis system that combines:
- **EU Nutri-Score** nutritional scoring
- **Age-specific safety rules** (infant to elderly)
- **Personal allergen matching**
- **Dietary restriction checking**
- **Environmental impact** (Eco-Score)
- **Processing level** (NOVA classification)
- **AI-powered personalized advice**

### Final Score Range
- **0-100 scale** where:
  - **80-100**: Safe (Green)
  - **40-79**: Use with Caution (Yellow)
  - **0-39**: Avoid (Red)

---

## Core Scoring System

### 1. Base Score Calculation

The final safety score is calculated using this formula:

```
Final Score = Nutri-Score (0-100) 
            - Safety Issue Penalties
            - Eco-Score Penalty
            - NOVA Penalty
```

**Clamped to**: `Math.max(0, Math.min(100, score))`

### 2. Safety Issue Penalties

| Severity Level | Penalty | Example |
|---------------|---------|---------|
| **CRITICAL** | -40 points | Personal allergen match, honey for infants |
| **AVOID** | -25 points | High caffeine for children, dietary violations |
| **CAUTION** | -10 points | High sodium, concerning additives |
| **SAFE** | 0 points | No issues detected |

### 3. Overall Safety Level Determination

The **worst-case** severity determines the overall safety level:

```javascript
if (any issue is CRITICAL) → Overall = CRITICAL
else if (any issue is AVOID) → Overall = AVOID  
else if (any issue is CAUTION) → Overall = CAUTION
else → Overall = SAFE
```

---

## Nutri-Score Algorithm

### EU Standard Implementation

The Nutri-Score is calculated using the official EU algorithm with two components:

#### N Component (Negative Points: 0-40)
Points awarded for **unhealthy** nutrients per 100g:

| Nutrient | Thresholds (per 100g) | Max Points |
|----------|----------------------|------------|
| **Energy** | 335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350 kJ | 10 |
| **Sugars** | 4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45 g | 10 |
| **Saturated Fat** | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 g | 10 |
| **Sodium** | 90, 180, 270, 360, 450, 540, 630, 720, 810, 900 mg | 10 |

**Total N Component**: Sum of all negative points (0-40)

#### P Component (Positive Points: 0-15)
Points awarded for **healthy** nutrients per 100g:

| Nutrient | Thresholds (per 100g) | Max Points |
|----------|----------------------|------------|
| **Fiber** | 0.9, 1.9, 2.8, 3.7, 4.7 g | 5 |
| **Protein** | 1.6, 3.2, 4.8, 6.4, 8.0 g | 5 |
| **Fruit/Veg %** | 40%, 60%, 80% | 0, 1, 2, or 5 |

**Special Rule**: If N ≥ 11 AND Fruit/Veg < 5 points, protein points are NOT counted.

**Total P Component**: Sum of positive points (0-15)

#### Raw Nutri-Score Calculation

```
Raw Score = N Component - P Component
Range: -15 (best) to +40 (worst)
```

#### Letter Grade Assignment

| Raw Score | Grade | Color |
|-----------|-------|-------|
| ≤ -1 | A | #038141 (Dark Green) |
| 0 to 2 | B | #85BB2F (Light Green) |
| 3 to 10 | C | #FECB02 (Yellow) |
| 11 to 18 | D | #EE8100 (Orange) |
| ≥ 19 | E | #E63E11 (Red) |

#### Conversion to 0-100 Scale

```javascript
score = 100 - ((rawScore + 15) / 55 * 100)
// -15 → 100 points
// +40 → 0 points
```

**Example**:
- Raw Score = -5 → `100 - ((-5 + 15) / 55 * 100)` = **82 points** (Grade A)
- Raw Score = 15 → `100 - ((15 + 15) / 55 * 100)` = **45 points** (Grade D)

---

## Safety Analysis Engine

### 1. Ingredient-Based Restrictions

#### Critical Restrictions

**Honey for Infants** (< 12 months):
```javascript
if (ageMonths < 12 && ingredientsLower.includes('honey')) {
  severity: CRITICAL
  penalty: -40 points
  reason: "Can cause infant botulism"
}
```

**Caffeine for Children/Teens** (< 18 years):
```javascript
if (ageMonths < 216 && caffeine > 0) {
  severity: ageMonths < 144 ? CRITICAL : AVOID
  penalty: ageMonths < 144 ? -40 : -25
  reason: "Not recommended for children and teens"
}
```

#### Allergen Detection

**General Allergens** (from OpenFoodFacts):
```javascript
if (product.allergens.length > 0) {
  severity: CAUTION
  penalty: -10 points
  reason: "Contains: milk, eggs, soy, etc."
}
```

### 2. Nutrient Threshold Checks

#### Sodium Limits (Age-Specific)

| Age Group | Daily Limit | Per 100g Threshold |
|-----------|-------------|-------------------|
| Toddler (1-3y) | 1200 mg | 300 mg (~25%) |
| Child (4-12y) | 1500 mg | 375 mg (~25%) |
| Teen (13-18y) | 1800 mg | 450 mg (~25%) |

```javascript
if (sodiumMg > limit) {
  severity: CAUTION
  penalty: -10 points
}
```

#### Sugar Limits (Age-Specific)

| Age Group | Daily Limit | Per 100g Threshold |
|-----------|-------------|-------------------|
| Children (<18y) | 25 g | 6.25 g (~25%) |
| Adults (18+) | 50 g | 12.5 g (~25%) |

```javascript
if (sugars > limit) {
  severity: sugars > limit * 2 ? AVOID : CAUTION
  penalty: sugars > limit * 2 ? -25 : -10
}
```

### 3. Additive Concerns

**Concerning Additives for Children** (< 12 years):

| E-Number | Name | Concern |
|----------|------|---------|
| E102 | Tartrazine (Yellow 5) | May cause hyperactivity |
| E110 | Sunset Yellow | May cause hyperactivity |
| E129 | Allura Red | May cause hyperactivity |
| E621 | MSG | Some children may be sensitive |
| E951 | Aspartame | Not recommended for young children |

```javascript
if (concerningAdditive && ageMonths < 144) {
  severity: CAUTION
  penalty: -10 points
}
```

---

## Personalization System

### 1. Personal Allergen Matching

**Algorithm**:
1. Normalize product allergens (e.g., "en:milk" → "milk")
2. Check direct matches with user's allergen list
3. Check mapped allergens (e.g., "dairy" matches "milk", "casein", "whey")
4. If match found → **CRITICAL** severity (-40 points)

**Allergen Mapping**:
```javascript
{
  'dairy': ['milk', 'lactose', 'casein', 'whey'],
  'tree nuts': ['almonds', 'cashews', 'walnuts', 'hazelnuts', 'pistachios', 'pecans'],
  'shellfish': ['shrimp', 'crab', 'lobster', 'prawns'],
  'fish': ['salmon', 'tuna', 'cod', 'anchovy']
}
```

### 2. Dietary Restriction Checking

**Supported Restrictions**:

| Restriction | Forbidden Ingredients | Severity | Penalty |
|-------------|----------------------|----------|---------|
| **Vegetarian** | gelatin, meat, chicken, beef, pork, fish, anchovy | AVOID | -25 |
| **Vegan** | milk, egg, honey, gelatin, meat, fish, butter, cheese, cream, whey, casein | AVOID | -25 |
| **Halal** | pork, lard, gelatin, alcohol, wine | AVOID | -25 |
| **Kosher** | pork, shellfish, shrimp, crab, lobster | CAUTION | -10 |
| **Gluten-Free** | wheat, barley, rye, oats, gluten | AVOID | -25 |
| **Lactose-Free** | milk, lactose, cream, cheese, butter, whey | AVOID | -25 |

**Algorithm**:
```javascript
if (ingredientsLower.includes(forbiddenIngredient)) {
  severity: check.severity
  penalty: severity === AVOID ? -25 : -10
  isPersonal: true
}
```

---

## Age-Based Restrictions

### Age Bracket Definitions

| Bracket | Age Range | Months | Label |
|---------|-----------|--------|-------|
| **Infant (Pre-weaning)** | 0-6 months | 0-6 | Infant (0-6 months) |
| **Infant (Weaning)** | 6-12 months | 6-12 | Infant (6-12 months) |
| **Toddler** | 1-3 years | 12-36 | Toddler (1-3 years) |
| **Child** | 4-12 years | 36-144 | Child (4-12 years) |
| **Teen** | 13-18 years | 144-216 | Teen (13-18 years) |
| **Adult** | 18-65 years | 216-780 | Adult (18-65 years) |
| **Elderly** | 65+ years | 780+ | Elderly (65+ years) |

### Age Conversion

**From Age Group to Months** (for family members):
```javascript
{
  'infant': 6,       // Average of 0-12 months
  'toddler': 24,     // Average of 1-3 years
  'child': 84,       // 7 years (middle of 4-12)
  'teen': 180,       // 15 years (middle of 13-18)
  'adult': 360,      // 30 years (middle of 18-65)
  'elderly': 780     // 65 years
}
```

**From Years to Months**:
```javascript
ageMonths = ageYears * 12
```

---

## Environmental & Processing Scores

### 1. Eco-Score (Environmental Impact)

| Grade | Label | Color | Penalty |
|-------|-------|-------|---------|
| **A** | Very Low Impact | #038141 | 0 |
| **B** | Low Impact | #85BB2F | 0 |
| **C** | Moderate Impact | #FECB02 | -5 |
| **D** | High Impact | #EE8100 | -10 |
| **E** | Very High Impact | #E63E11 | -15 |

**Impact on Score**:
```javascript
finalScore -= ecoScoreInfo.penalty
```

### 2. NOVA Group (Processing Level)

| Group | Label | Color | Penalty |
|-------|-------|-------|---------|
| **1** | Unprocessed | #038141 | 0 |
| **2** | Processed Ingredients | #85BB2F | 0 |
| **3** | Processed Foods | #FECB02 | -5 |
| **4** | Ultra-Processed | #E63E11 | -12 |

**Impact on Score**:
```javascript
finalScore -= novaInfo.penalty
```

---

## AI Integration

### System Prompt

The AI assistant ("Goodfor AI") provides personalized nutrition advice with:
- Ingredient analysis
- Safety score explanations
- Healthier alternatives
- Age-appropriate recommendations

### User Context Building

The AI receives comprehensive context:

```javascript
{
  ageGroup: "child",
  allergens: ["peanuts", "dairy"],
  dietaryPreferences: ["vegetarian"],
  familyMembers: [
    { name: "Emma", age_group: "toddler", dietary_preferences: [] }
  ],
  recentScans: [
    { product_name: "Chocolate Bar", safety_level: "caution", safety_score: 52 }
  ],
  favorites: ["Organic Granola", "Almond Milk"]
}
```

### Conversation Memory

- **Full history** maintained (last 20 messages)
- **Older messages** summarized to stay within token limits
- **Context-aware** responses referencing previous discussions
- **Personalized** based on user profile and scan history

### AI Model Configuration

```javascript
{
  model: "gpt-4o-mini",
  temperature: 0.7,
  max_tokens: 800,
  stream: true  // For real-time responses
}
```

---

## Product Alternatives Algorithm

The GoodFor alternatives system finds healthier product options using a multi-strategy approach that combines category-based search, intelligent scoring, and comparative analysis.

### Overview

**Goal**: Find 3-5 healthier alternatives to a scanned product within the same category.

**Data Sources**:
1. **Primary**: Supabase Edge Function (`get-alternatives`)
2. **Fallback**: OpenFoodFacts API direct search

### Alternative Discovery Strategies

#### Strategy 1: Category-Based Search (Primary)

**Most Effective Method** - Uses product category tags for precise matching.

```javascript
// Extract category from product
const categoryTag = product.categories[0]; // e.g., "en:beverages"

// Query OpenFoodFacts category endpoint
const url = `https://world.openfoodfacts.org/category/${categoryTag}.json
  ?page_size=${count * 6}
  &fields=code,product_name,brands,image_url,nutriscore_grade,
          nova_group,additives_tags,allergens_tags,nutriments,categories_tags`;
```

**Filtering**:
1. Exclude scanned product (by barcode)
2. Require product name (filter out incomplete entries)
3. Sort by Nutri-Score grade (A > B > C > D > E)

**Grade Order Mapping**:
```javascript
const gradeOrder = { 
  'a': 0,  // Best
  'b': 1, 
  'c': 2, 
  'd': 3, 
  'e': 4, 
  'unknown': 5  // Worst
};
```

**Result**: Top `count` products (default: 5) with best Nutri-Scores in same category.

#### Strategy 2: Text Search (Fallback)

Used if category search returns insufficient results.

**Search Term Construction**:
```javascript
// Clean category name
const cleanCategory = product.categories[0]
  .replace('en:', '')           // Remove language prefix
  .replace(/-/g, ' ')            // Replace hyphens with spaces
  .split(' ')                    // Split into words
  .filter(w => w.length > 2)     // Remove short words
  .slice(0, 2)                   // Take first 2 words
  .join(' ');                    // Rejoin

// Example: "en:chocolate-bars" → "chocolate bars"
```

**Query**:
```javascript
const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl
  ?search_terms=${encodeURIComponent(searchTerms)}
  &search_simple=1
  &action=process
  &json=1
  &page_size=${count * 3}
  &fields=...`;
```

### Alternative Scoring System

Each alternative receives a score (0-100) based on multiple factors:

#### Base Score Calculation

**From Nutri-Score Grade**:
```javascript
const nutriScoreMap = {
  'a': 95,  // Excellent
  'b': 85,  // Good
  'c': 70,  // Average
  'd': 55,  // Below Average
  'e': 40   // Poor
};
const baseScore = nutriScoreMap[alt.nutriScore?.toLowerCase()] || 65;
```

#### Additive Bonus

**Fewer additives = Better score**:
```javascript
const additiveBonus = Math.max(0, 5 - (alt.additives?.length || 0));
// 0 additives: +5 points
// 1 additive:  +4 points
// 2 additives: +3 points
// 3 additives: +2 points
// 4 additives: +1 point
// 5+ additives: 0 points
```

#### Final Alternative Score

```javascript
finalScore = Math.min(100, baseScore + additiveBonus);
```

**Example**:
- Nutri-Score B (85) + 2 additives (+3) = **88/100**
- Nutri-Score A (95) + 0 additives (+5) = **100/100**

### Comparison Logic ("Why It's Better")

Each alternative shows 1-2 reasons why it's better than the original product.

#### Reason Priority Order

1. **Better Nutri-Score Grade**
   ```javascript
   if (altNutriScore < originalNutriScore) {
     reasons.push('Better Nutri-Score grade');
   }
   // 'a' < 'b' < 'c' < 'd' < 'e' (alphabetically)
   ```

2. **Fewer Additives**
   ```javascript
   if (altAdditives < origAdditives && origAdditives !== 999) {
     reasons.push('Fewer additives');
   }
   ```

3. **Lower Sugar Content**
   ```javascript
   const altSugars = alt.nutriments?.sugars || 0;
   const origSugars = original.nutriments?.sugars || 999;
   
   if (altSugars < origSugars && origSugars !== 999) {
     if (altSugars < origSugars * 0.7) {
       reasons.push('Significantly lower sugar');  // >30% reduction
     } else {
       reasons.push('Lower sugar content');
     }
   }
   ```

4. **Lower Sodium Content**
   ```javascript
   if (altSodium < origSodium && origSodium !== 999) {
     reasons.push('Lower sodium content');
   }
   ```

5. **Less Processed (NOVA Group)**
   ```javascript
   // NOVA: 1 (unprocessed) < 2 < 3 < 4 (ultra-processed)
   if (altNova < origNova && origNova !== 5) {
     reasons.push('Less processed');
   }
   ```

#### Fallback Reasons

If no comparative advantages found:

```javascript
if (reasons.length < 2) {
  if (alt.nutriScore === 'a') {
    reasons.push('Excellent nutritional profile');
  } else if (alt.nutriScore === 'b') {
    reasons.push('Good nutritional balance');
  }
}

// Final fallback
if (reasons.length === 0) {
  if (alt.novaGroup && alt.novaGroup <= 2) {
    reasons.push('Minimally processed');
  }
  reasons.push('Better alternative in category');
}
```

**Return**: Top 2 reasons only (`reasons.slice(0, 2)`)

### Badge Assignment

Each alternative gets a badge indicating its quality tier:

```javascript
badge = index === 0 ? 'Top Match' :           // First result
        alt.safetyLevel === 'safe' ? 'Safe Choice' :
        (alt.nutriScore === 'a' || alt.nutriScore === 'b') ? 'Healthy Choice' :
        'Alternative';                         // Default
```

**Badge Types**:
- **Top Match**: Best overall alternative (always first)
- **Safe Choice**: Safety score indicates "safe" level
- **Healthy Choice**: Nutri-Score A or B
- **Alternative**: Standard alternative

### Edge Function Integration

The system first attempts to use the Supabase Edge Function for enhanced alternatives:

#### Request Data

```javascript
{
  barcode: product.barcode,
  category: product.category || product.categories?.[0],
  categories_tags: product.categories_tags || product.categories,
  safety_score: product.safetyScore || 50,
  nutri_score: product.nutriScore,
  user_id: user?.id
}
```

#### Edge Function Features

- **Caching**: Previously found alternatives cached in database
- **User Preferences**: Considers user's allergens and dietary restrictions
- **Smart Ranking**: Uses safety scores and personalization
- **Retry Logic**: Exponential backoff (500ms, 1s, 2s)
- **Timeout**: 15 seconds per request

#### Fallback Mechanism

```javascript
try {
  alternatives = await getAlternativesEdge(product);
} catch (edgeError) {
  console.log('Edge Function failed, using OpenFoodFacts fallback');
  alternatives = await getAlternativesLocal(product, 5);
}
```

### Complete Algorithm Flow

```
User views product with low score
  ↓
┌─────────────────────────────────────────────┐
│ 1. Try Edge Function (Primary)             │
│    - Send product data + user context      │
│    - Check cache for existing alternatives │
│    - Apply personalization filters         │
│    - Timeout: 15s, Retries: 2              │
└─────────────────────────────────────────────┘
  ↓
  ├─ Success → Parse Edge Function results
  │
  └─ Failure ↓
┌─────────────────────────────────────────────┐
│ 2. Fallback to OpenFoodFacts Direct        │
│    Strategy 1: Category-based search       │
│    - Query category endpoint               │
│    - Get 30 products (count * 6)           │
│    - Filter & sort by Nutri-Score          │
│    - Take top 5                            │
└─────────────────────────────────────────────┘
  ↓
  ├─ Enough results (≥5) → Skip Strategy 2
  │
  └─ Insufficient ↓
┌─────────────────────────────────────────────┐
│    Strategy 2: Text search                 │
│    - Build search terms from category      │
│    - Query search endpoint                 │
│    - Get 15 products (count * 3)           │
│    - Filter & sort                         │
│    - Fill remaining slots                  │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ 3. Score Each Alternative                  │
│    - Base score from Nutri-Score (40-95)   │
│    - Additive bonus (0-5 points)           │
│    - Clamp to 0-100                        │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ 4. Generate Comparison Reasons             │
│    For each alternative:                   │
│    - Check Nutri-Score improvement         │
│    - Check fewer additives                 │
│    - Check lower sugar (>30% = significant)│
│    - Check lower sodium                    │
│    - Check less processed (NOVA)           │
│    - Add fallback reasons if needed        │
│    - Return top 2 reasons                  │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ 5. Assign Badges                           │
│    - First result: "Top Match"             │
│    - Safe products: "Safe Choice"          │
│    - Nutri-Score A/B: "Healthy Choice"     │
│    - Others: "Alternative"                 │
└─────────────────────────────────────────────┘
  ↓
Display 3-5 alternatives ranked by score
```

### Example: Finding Alternatives

**Original Product**: Chocolate Bar
```javascript
{
  barcode: "1234567890",
  name: "Milk Chocolate Bar",
  category: "en:chocolate-bars",
  nutriScore: "e",
  safetyScore: 28,
  additives: ["e322", "e476", "e442"],
  nutriments: {
    sugars: 54,
    sodium: 0.12
  },
  novaGroup: 4
}
```

**Alternative 1** (Top Match):
```javascript
{
  name: "Dark Chocolate 70% Cocoa",
  brand: "Organic Brand",
  nutriScore: "b",
  score: 88,  // 85 (B) + 3 (2 additives)
  badge: "Top Match",
  reasons: [
    "Better Nutri-Score grade",      // e → b
    "Significantly lower sugar"       // 54g → 35g (35% reduction)
  ]
}
```

**Alternative 2** (Healthy Choice):
```javascript
{
  name: "85% Dark Chocolate",
  brand: "Premium Organic",
  nutriScore: "a",
  score: 100,  // 95 (A) + 5 (0 additives)
  badge: "Healthy Choice",
  reasons: [
    "Better Nutri-Score grade",      // e → a
    "Fewer additives"                 // 3 → 0
  ]
}
```

**Alternative 3**:
```javascript
{
  name: "Milk Chocolate with Almonds",
  brand: "Natural Foods",
  nutriScore: "c",
  score: 73,  // 70 (C) + 3 (2 additives)
  badge: "Alternative",
  reasons: [
    "Better Nutri-Score grade",      // e → c
    "Lower sugar content"             // 54g → 42g
  ]
}
```

### Ranking Logic

Alternatives are displayed in order of:

1. **Score** (highest first)
2. **Nutri-Score Grade** (A > B > C > D > E)
3. **Additive Count** (fewer is better)

```javascript
alternatives.sort((a, b) => {
  // Primary: Score
  if (a.score !== b.score) return b.score - a.score;
  
  // Secondary: Nutri-Score
  const gradeOrder = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4 };
  const aGrade = gradeOrder[a.nutriScore] || 5;
  const bGrade = gradeOrder[b.nutriScore] || 5;
  if (aGrade !== bGrade) return aGrade - bGrade;
  
  // Tertiary: Additives
  return (a.additives?.length || 0) - (b.additives?.length || 0);
});
```

### Performance Optimizations

1. **Deduplication**: Track seen barcodes to avoid duplicates
   ```javascript
   const seenBarcodes = new Set([product.barcode]);
   ```

2. **Rate Limiting**: Enforce 1-second delay between OpenFoodFacts requests
   ```javascript
   await enforceRateLimit();  // Wait 1000ms since last request
   ```

3. **Pagination**: Request more products than needed (count × 6) to account for filtering
   ```javascript
   page_size = count * 6  // Request 30 for 5 results
   ```

4. **Field Selection**: Only request needed fields to reduce payload size
   ```javascript
   fields=code,product_name,brands,image_url,nutriscore_grade,
         nova_group,additives_tags,allergens_tags,nutriments
   ```

### Error Handling

```javascript
try {
  // Try Edge Function
  alternatives = await getAlternativesEdge(product);
} catch (edgeError) {
  console.log('[Alternatives] Edge Function failed:', edgeError.message);
  
  try {
    // Fallback to OpenFoodFacts
    alternatives = await getAlternativesLocal(product, 5);
  } catch (localError) {
    console.error('[Alternatives] All methods failed:', localError);
    // Display empty state to user
    alternatives = [];
  }
}
```

### User Experience

**Loading State**:
```
"Finding alternatives..."
```

**Empty State**:
```
"No alternatives found for this product category."
```

**Success State**:
```
3-5 alternative cards showing:
- Product image
- Name and brand
- Score badge (e.g., "88/100")
- Quality badge (e.g., "Top Match")
- 2 improvement reasons
- "View details" button
```

---

## Data Flow

### 1. Barcode Scan → Product Lookup

```
User scans barcode
  ↓
Query OpenFoodFacts API
  ↓
Parse product data:
  - Name, brand, category
  - Ingredients text
  - Nutriments (energy, sugars, fat, sodium, fiber, protein)
  - Allergens list
  - Additives list
  - Eco-Score grade
  - NOVA group
  - Image URL
```

### 2. Safety Analysis Pipeline

```
Product Data + User Context
  ↓
┌─────────────────────────────────────┐
│ 1. Check Ingredient Restrictions    │
│    - Honey for infants              │
│    - Caffeine for children          │
│    - General allergens              │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 2. Check Nutrient Thresholds        │
│    - Age-specific sodium limits     │
│    - Age-specific sugar limits      │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 3. Check Additives                  │
│    - Concerning E-numbers           │
│    - Age-specific concerns          │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 4. Check Personal Allergens         │
│    - Direct matches                 │
│    - Mapped allergens               │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 5. Check Dietary Restrictions       │
│    - Vegetarian, vegan, halal, etc. │
│    - Ingredient scanning            │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 6. Calculate Nutri-Score            │
│    - N Component (negative)         │
│    - P Component (positive)         │
│    - Raw score → 0-100 scale        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ 7. Apply Penalties                  │
│    - Safety issues                  │
│    - Eco-Score                      │
│    - NOVA group                     │
└─────────────────────────────────────┘
  ↓
Final Safety Score (0-100)
```

### 3. Database Storage

```
Scan Result
  ↓
┌─────────────────────────────────────┐
│ Upsert to `products` table          │
│  - barcode, name, brand, category   │
│  - ingredients, nutriments          │
│  - allergens, additives             │
│  - eco_score, nova_group            │
│  - image_url                        │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ Insert to `scans` table             │
│  - user_id, product_barcode         │
│  - safety_level, safety_score       │
│  - issues (JSON)                    │
│  - scanned_at timestamp             │
└─────────────────────────────────────┘
  ↓
User's Scan History Updated
```

---

## Calculation Examples

### Example 1: Chocolate Bar (Child, Age 8)

**Product Data**:
```javascript
{
  name: "Milk Chocolate Bar",
  nutriments: {
    energy_kcal: 530,
    sugars: 54,
    saturated_fat: 18,
    sodium: 0.12,  // 120mg
    fiber: 3,
    proteins: 7
  },
  allergens: ["en:milk", "en:soy"],
  additives: ["en:e322"],
  ecoScore: "c",
  novaGroup: 4
}
```

**User Context**:
```javascript
{
  ageMonths: 96,  // 8 years
  allergies: [],
  dietaryRestrictions: []
}
```

**Step-by-Step Calculation**:

1. **Nutri-Score Calculation**:
   - Energy: 530 kcal × 4.184 = 2217 kJ → **6 points**
   - Sugars: 54g → **10 points** (max)
   - Saturated Fat: 18g → **10 points** (max)
   - Sodium: 120mg → **1 point**
   - **N Component = 27 points**
   
   - Fiber: 3g → **3 points**
   - Protein: 7g → **4 points**
   - Fruit/Veg: 0% → **0 points**
   - **P Component = 7 points** (protein counts since N < 11 is false, but fruit/veg < 5)
   - Actually: **P Component = 3 points** (only fiber, protein excluded)
   
   - **Raw Score = 27 - 3 = 24** → Grade **E**
   - **0-100 Scale = 100 - ((24 + 15) / 55 × 100) = 29 points**

2. **Safety Issues**:
   - High Sugar (54g > 6.25g × 2): **AVOID** → **-25 points**
   - Contains Allergens (milk, soy): **CAUTION** → **-10 points**

3. **Environmental/Processing**:
   - Eco-Score C: **-5 points**
   - NOVA Group 4 (Ultra-processed): **-12 points**

4. **Final Score**:
   ```
   29 (Nutri-Score)
   - 25 (High Sugar)
   - 10 (Allergens)
   - 5 (Eco-Score)
   - 12 (NOVA)
   = -23 → Clamped to 0
   ```
   
   **Final: 0/100 - AVOID** ❌

---

### Example 2: Organic Apple Sauce (Toddler, Age 2)

**Product Data**:
```javascript
{
  name: "Organic Apple Sauce",
  nutriments: {
    energy_kcal: 45,
    sugars: 9,
    saturated_fat: 0.1,
    sodium: 0.002,  // 2mg
    fiber: 1.5,
    proteins: 0.2
  },
  allergens: [],
  additives: [],
  ecoScore: "a",
  novaGroup: 2
}
```

**User Context**:
```javascript
{
  ageMonths: 24,  // 2 years
  allergies: [],
  dietaryRestrictions: []
}
```

**Step-by-Step Calculation**:

1. **Nutri-Score Calculation**:
   - Energy: 45 kcal × 4.184 = 188 kJ → **0 points**
   - Sugars: 9g → **1 point**
   - Saturated Fat: 0.1g → **0 points**
   - Sodium: 2mg → **0 points**
   - **N Component = 1 point**
   
   - Fiber: 1.5g → **1 point**
   - Protein: 0.2g → **0 points**
   - Fruit/Veg: 100% (assumed) → **5 points**
   - **P Component = 6 points**
   
   - **Raw Score = 1 - 6 = -5** → Grade **A**
   - **0-100 Scale = 100 - ((-5 + 15) / 55 × 100) = 82 points**

2. **Safety Issues**:
   - Sugar (9g > 6.25g but < 12.5g): **CAUTION** → **-10 points**

3. **Environmental/Processing**:
   - Eco-Score A: **0 points**
   - NOVA Group 2: **0 points**

4. **Final Score**:
   ```
   82 (Nutri-Score)
   - 10 (Moderate Sugar)
   - 0 (Eco-Score)
   - 0 (NOVA)
   = 72
   ```
   
   **Final: 72/100 - USE WITH CAUTION** ⚠️

---

### Example 3: Whole Grain Bread (Adult, Vegan)

**Product Data**:
```javascript
{
  name: "Whole Grain Bread",
  nutriments: {
    energy_kcal: 250,
    sugars: 3,
    saturated_fat: 0.5,
    sodium: 0.45,  // 450mg
    fiber: 7,
    proteins: 9
  },
  allergens: ["en:gluten"],
  additives: [],
  ecoScore: "b",
  novaGroup: 2,
  ingredientsText: "whole wheat flour, water, yeast, salt"
}
```

**User Context**:
```javascript
{
  ageMonths: 360,  // 30 years
  allergies: [],
  dietaryRestrictions: ["vegan"]
}
```

**Step-by-Step Calculation**:

1. **Nutri-Score Calculation**:
   - Energy: 250 kcal × 4.184 = 1046 kJ → **3 points**
   - Sugars: 3g → **0 points**
   - Saturated Fat: 0.5g → **0 points**
   - Sodium: 450mg → **5 points**
   - **N Component = 8 points**
   
   - Fiber: 7g → **5 points** (max)
   - Protein: 9g → **5 points** (max)
   - Fruit/Veg: 0% → **0 points**
   - **P Component = 10 points** (N < 11, so protein counts)
   
   - **Raw Score = 8 - 10 = -2** → Grade **A**
   - **0-100 Scale = 100 - ((-2 + 15) / 55 × 100) = 76 points**

2. **Safety Issues**:
   - Contains Gluten (general allergen): **CAUTION** → **-10 points**
   - Vegan-compatible (no animal ingredients): **No penalty**

3. **Environmental/Processing**:
   - Eco-Score B: **0 points**
   - NOVA Group 2: **0 points**

4. **Final Score**:
   ```
   76 (Nutri-Score)
   - 10 (Contains Allergen)
   - 0 (Eco-Score)
   - 0 (NOVA)
   = 66
   ```
   
   **Final: 66/100 - USE WITH CAUTION** ⚠️

---

### Example 4: Infant Formula (6-month-old)

**Product Data**:
```javascript
{
  name: "Infant Formula Stage 2",
  nutriments: {
    energy_kcal: 66,
    sugars: 7.2,
    saturated_fat: 1.6,
    sodium: 0.02,  // 20mg
    fiber: 0,
    proteins: 1.3
  },
  allergens: ["en:milk"],
  additives: [],
  ecoScore: "c",
  novaGroup: 4,
  ingredientsText: "lactose, vegetable oils, milk proteins, vitamins, minerals"
}
```

**User Context**:
```javascript
{
  ageMonths: 6,  // 6 months
  allergies: [],
  dietaryRestrictions: []
}
```

**Step-by-Step Calculation**:

1. **Nutri-Score Calculation**:
   - Energy: 66 kcal × 4.184 = 276 kJ → **0 points**
   - Sugars: 7.2g → **1 point**
   - Saturated Fat: 1.6g → **1 point**
   - Sodium: 20mg → **0 points**
   - **N Component = 2 points**
   
   - Fiber: 0g → **0 points**
   - Protein: 1.3g → **0 points**
   - Fruit/Veg: 0% → **0 points**
   - **P Component = 0 points**
   
   - **Raw Score = 2 - 0 = 2** → Grade **B**
   - **0-100 Scale = 100 - ((2 + 15) / 55 × 100) = 69 points**

2. **Safety Issues**:
   - Contains Milk (general allergen): **CAUTION** → **-10 points**
   - Age-appropriate formula: **No additional penalty**

3. **Environmental/Processing**:
   - Eco-Score C: **-5 points**
   - NOVA Group 4: **-12 points**

4. **Final Score**:
   ```
   69 (Nutri-Score)
   - 10 (Contains Allergen)
   - 5 (Eco-Score)
   - 12 (NOVA)
   = 42
   ```
   
   **Final: 42/100 - USE WITH CAUTION** ⚠️

---

## Summary of Key Formulas

### 1. Nutri-Score Raw Score
```
Raw Score = (Energy Points + Sugar Points + Saturated Fat Points + Sodium Points)
          - (Fiber Points + Protein Points* + Fruit/Veg Points)

*Protein excluded if N ≥ 11 AND Fruit/Veg < 5 points
```

### 2. Nutri-Score to 0-100 Scale
```
Score = 100 - ((Raw Score + 15) / 55 × 100)
```

### 3. Final Safety Score
```
Final Score = Nutri-Score (0-100)
            - Σ(Safety Issue Penalties)
            - Eco-Score Penalty
            - NOVA Penalty

Clamped to [0, 100]
```

### 4. Overall Safety Level
```
if (any CRITICAL issue) → CRITICAL
else if (any AVOID issue) → AVOID
else if (any CAUTION issue) → CAUTION
else → SAFE
```

---

## Technical Implementation Notes

### Data Sources
- **OpenFoodFacts API**: Product data, ingredients, nutrients, allergens
- **User Profile**: Age, allergens, dietary preferences
- **Family Members**: Additional profiles for personalized scanning

### Performance Optimizations
- **Caching**: Product data cached in local database
- **Batch Processing**: Multiple checks run in parallel
- **Efficient Parsing**: Ingredient text normalized once

### Error Handling
- **Missing Data**: Graceful degradation with default values
- **Invalid Barcodes**: User-friendly error messages
- **API Failures**: Retry logic with exponential backoff

### Future Enhancements
- **Machine Learning**: Predict safety scores from images
- **Crowd-sourced Data**: User-reported ingredients and issues
- **Regional Variations**: Country-specific regulations and standards
- **Batch Scanning**: Analyze multiple products simultaneously

---

## Appendix: Complete Code References

### Core Files
1. **`/src/lib/productSafety.js`** (546 lines)
   - Main safety analysis engine
   - Nutri-Score calculation
   - Age-based restrictions
   - Personalization logic

2. **`/src/lib/openai.js`** (249 lines)
   - AI chat integration
   - Context building
   - Conversation memory

3. **`/src/app/scan-processing.jsx`** (460 lines)
   - Barcode processing
   - Product lookup
   - Database storage

4. **`/src/app/onboarding/safety-scoring.tsx`** (376 lines)
   - UI for score ranges
   - Visual representation

---

**Document Version**: 1.0  
**Last Updated**: January 19, 2026  
**Maintained By**: GoodFor Development Team
