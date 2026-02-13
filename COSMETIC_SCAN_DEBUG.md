# Cosmetic Scanning Debug Guide

## Issue: Cosmetic Products Not Being Scanned

### Changes Made

#### 1. Added Comprehensive Logging

**File**: `src/app/scan-processing.jsx`
- Added product type check logging
- Shows whether routing to COSMETIC or FOOD analysis
- Logs cosmetic analysis results including personal concerns

**File**: `src/lib/cosmeticSafety.js`
- Added entry logging with product name
- Logs personalization data received
- Logs final analysis results (score, pillars, personal concerns)

#### 2. Defensive Defaults

**File**: `src/lib/cosmeticSafety.js`
- Set `personalConcerns` default to empty array: `personalConcerns: scoreResult.personalConcerns || []`
- Ensures no undefined values break the UI

### How to Debug

#### Step 1: Check Console Logs

When you scan a beauty product, you should see this sequence in the console:

```
[ScanProcessing] Product type check: BEAUTY === BEAUTY ? true
[ScanProcessing] ✓ Routing to COSMETIC analysis
[CosmeticSafety] ✓ Starting cosmetic analysis for: [Product Name]
[CosmeticSafety] Personalization data: { skinType: '...', skinConditions: [...], ... }
[CosmeticSafety] ✓ Analysis complete: { score: 75, safety: 'SAFE', ... }
[ScanProcessing] Cosmetic analysis result: { safety: 'SAFE', score: 75, ... }
```

#### Step 2: If Routing to FOOD Instead

If you see:
```
[ScanProcessing] → Routing to FOOD analysis
```

**Problem**: Product type is not 'BEAUTY'

**Solutions**:
1. Check OpenBeautyFacts API is returning data
2. Verify `productRouter.js` is setting `productType: PRODUCT_TYPES.BEAUTY`
3. Check barcode is valid cosmetic product code

#### Step 3: If Personal Concerns Not Showing

**Check**:
1. Did you set cosmetic allergens in profile?
2. Does product contain those allergens?
3. Is `personalConcerns` array in console logs?

**Verify Console Log**:
```
[CosmeticSafety] ✓ Analysis complete: {
  personalConcernsCount: 2  // Should be > 0
}
```

### Testing Checklist

#### Test 1: Scan a Beauty Product

**Example Barcodes** (if available in OpenBeautyFacts):
- Any shampoo/lotion with linalool
- Any fragrance product
- Any product with retinol

**Expected**:
```
✓ Product type: BEAUTY
✓ Routing to cosmetic analysis
✓ Analysis completes with pillars
✓ Personal concerns detected (if allergens match)
```

#### Test 2: With Personal Allergen

1. Edit Profile → Beauty Preferences → Add "Linalool"
2. Scan fragranced product
3. **Expected**: Personal Concerns card shows "LINALOOL" alert

#### Test 3: With Sensitive Skin

1. Edit Profile → Skin Type → "Sensitive"
2. Scan product with fragrance
3. **Expected**: Personal Concerns shows sensitive skin warning

#### Test 4: With Pregnancy

1. Edit Profile → Toggle "Pregnant"
2. Scan product with retinol
3. **Expected**: Personal Concerns shows pregnancy warning, score capped at 25

### Common Issues & Solutions

#### Issue: "Product not found in database"

**Cause**: Barcode not in OpenBeautyFacts or OpenFoodFacts

**Solution**:
- Try a different product
- Check barcode format (should be 13 digits for EAN-13)
- Some beauty products might not be in the database yet

#### Issue: Product scans as FOOD not BEAUTY

**Cause**: Product found in OpenFoodFacts first

**Solution**: This is expected behavior. The router tries:
1. Check if barcode prefix suggests beauty (fast check)
2. If yes, try OpenBeautyFacts first
3. Otherwise try OpenFoodFacts first
4. Fallback to the other API

**File**: `src/lib/productRouter.js` - You can modify the `mightBeBeautyProduct()` function to add more prefixes.

#### Issue: Personal Concerns Not Showing

**Debug Checklist**:
1. ✓ Check console for `personalConcernsCount` > 0
2. ✓ Verify profile saved correctly (check Supabase profiles table)
3. ✓ Ensure cosmetic allergens field exists in database
4. ✓ Check product actually contains the allergen

**SQL Query to Verify Profile**:
```sql
SELECT
  full_name,
  skin_type,
  skin_conditions,
  cosmetic_allergens,
  is_pregnant
FROM profiles
WHERE id = '[your-user-id]';
```

### Expected Console Output (Success)

```
[ScanProcessing] Analyzing with preferences: {
  ageMonths: 360,
  productType: 'BEAUTY',
  cosmeticPrefs: {
    skinType: 'sensitive',
    skinConditions: ['acne_prone'],
    cosmeticAllergens: ['linalool']
  }
}

[ScanProcessing] Product type check: BEAUTY === BEAUTY ? true
[ScanProcessing] ✓ Routing to COSMETIC analysis

[CosmeticSafety] ✓ Starting cosmetic analysis for: Example Shampoo
[CosmeticSafety] Personalization data: {
  skinType: 'sensitive',
  skinConditions: ['acne_prone'],
  cosmeticAllergens: ['linalool'],
  isPregnant: false
}

[CosmeticSafety] ✓ Analysis complete: {
  score: 68,
  safety: 'CAUTION',
  issuesCount: 3,
  personalConcernsCount: 2,
  pillars: { toxicity: 25, sensitization: 18, endocrine: 25, environment: 15, dataQuality: 10 }
}

[ScanProcessing] Cosmetic analysis result: {
  safety: 'CAUTION',
  score: 68,
  issuesCount: 3,
  hasPillars: true,
  hasPersonalConcerns: true
}
```

### Files Modified for Debugging

1. `src/app/scan-processing.jsx` - Lines 158-175 (added logging)
2. `src/lib/cosmeticSafety.js` - Lines 159-167, 298-310 (added logging & defaults)

### Next Steps

1. **Clear app cache**: `npx expo start --clear`
2. **Scan a beauty product**
3. **Check console logs** for the sequence above
4. **Take screenshot** of console if issues persist
5. **Report** which step fails in the sequence

---

**Status**: Debug logging enabled
**Date**: 2026-01-26
**Ready for testing**: ✅
