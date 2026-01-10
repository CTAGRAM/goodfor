# Building "GoodFor": Technical Blueprint for an Open Source Product Scanner

A barcode scanner app providing age-specific safety information can be built entirely on free, open source APIs. OpenFoodFacts and OpenBeautyFacts serve as the foundation for product data, while FDA OpenFDA and UK FSA provide recall monitoring. The critical challenge lies not in API access—most required data is freely available—but in building an intelligent rule engine that interprets nutritional and ingredient data through the lens of age-appropriate safety thresholds.

---

## Food product data flows through OpenFoodFacts' robust API ecosystem

OpenFoodFacts (OFF) provides the most comprehensive free food database available, with **3+ million products** and a well-documented REST API. The architecture supports both real-time scanning and bulk data synchronization.

### Core API endpoints and authentication

**Base URL:** `https://world.openfoodfacts.org` (production)

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `GET /api/v2/product/{barcode}.json` | Single product lookup | `/api/v2/product/3017620422003.json` |
| `GET /api/v2/search` | Search with filters | `/api/v2/search?code=123,456,789` |
| `GET /cgi/suggest.pl?tagtype={type}&term={query}` | Autocomplete | `?tagtype=allergens&term=milk` |

**Authentication requirements:** None for read operations. Write operations require `user_id` and `password`. **Critical:** A proper `User-Agent` header is mandatory—format: `AppName/Version (contact@email.com)`. Requests without this header may be blocked as bot traffic.

**Rate limits** enforce fair usage:
- Product queries: **100 requests/minute**
- Search queries: **10 requests/minute**  
- Facet queries: **2 requests/minute**
- Do NOT implement search-as-you-type (will trigger blocks)

### Available data fields cover all safety-relevant information

The API returns rich structured data including parsed ingredients, allergens, additives, and scoring systems:

```json
{
  "product": {
    "code": "3017620422003",
    "product_name": "Nutella",
    "ingredients_text": "Sugar, Palm oil, Hazelnuts 13%...",
    "allergens_tags": ["en:milk", "en:nuts"],
    "additives_tags": ["en:e322", "en:e476"],
    "nutriments": {
      "sugars_100g": 56.3,
      "sodium_100g": 0.0428,
      "energy-kcal_100g": 539
    },
    "nutrition_grades": "e",
    "nova_group": 4,
    "ecoscore_grade": "d"
  }
}
```

Key safety-relevant fields: `allergens_tags`, `traces_tags` (may contain), `additives_tags` (E-numbers), `ingredients_analysis_tags` (vegan/palm-oil detection), and the full `nutriments` object with per-100g values for sodium, sugars, saturated fat, and caffeine where available.

### Batch queries and bulk data enable efficient operations

**Multiple barcodes in single request:**
```
GET /api/v2/search?code=3263859883713,8437011606013,6111069000451&fields=code,product_name,allergens_tags
```

**Bulk exports for offline database:**
| Format | URL | Size |
|--------|-----|------|
| MongoDB dump | `static.openfoodfacts.org/data/openfoodfacts-mongodbdump.gz` | ~6GB |
| JSONL | `static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz` | ~7GB |
| Daily delta | `static.openfoodfacts.org/data/delta/index.txt` | 14 days |

For a production scanner, the recommended approach is: real-time API calls for scans, nightly delta sync for local caching, and full MongoDB restore for initial database population.

---

## OpenBeautyFacts mirrors the food API for cosmetic products

OpenBeautyFacts (OBF) uses an **identical API structure** to OpenFoodFacts, making integration straightforward. The database contains ~100,000+ cosmetic products with INCI ingredient lists.

**Base URL:** `https://world.openbeautyfacts.org`

```
GET https://world.openbeautyfacts.org/api/v2/product/{barcode}.json
```

The response structure is identical to OFF, with `ingredients_text` containing the INCI list and `allergens_tags` identifying flagged allergens. Bulk exports follow the same pattern at `static.openbeautyfacts.org/data/`.

### EU CosIng provides authoritative ingredient safety data

The **EU Cosmetic Ingredient Database (CosIng)** is the definitive reference for cosmetic ingredient restrictions, though it lacks a public API. Data is accessible through the EU Open Data Portal as downloadable CSV files:

- **Ingredients inventory:** Contains 30,000+ INCI names with CAS numbers, functions, and restrictions
- **Annex II (Prohibited):** ~1,300+ banned substances
- **Annex III (Restricted):** Conditional use with concentration limits
- **Annexes IV-VI:** Positive lists for colorants, preservatives, UV filters

**Third-party API access:** api.store offers free wrappers around CosIng data, providing programmatic access to ingredient restrictions and Annex classifications.

### The 26 EU fragrance allergens require special handling

EU Regulation 1223/2009 mandates labeling of **26 fragrance allergens** when present above threshold concentrations (0.001% leave-on, 0.01% rinse-off). These include Limonene, Linalool, Citral, Geraniol, Coumarin, and 21 others. **Note:** Regulation 2023/1545 expands this to **80+ allergens** with compliance deadlines of July 2026 (new products) and July 2028 (existing products).

For baby products, the rule engine should flag ANY fragrance/parfum regardless of specific allergen labeling, as infant skin sensitivity warrants complete fragrance avoidance.

---

## Global recall monitoring requires multi-source integration

No single API covers all recall data. An effective safety system must aggregate from multiple government sources, each with different access methods.

### FDA OpenFDA is the most developer-friendly recall API

**Base URL:** `https://api.fda.gov`
**Food endpoint:** `https://api.fda.gov/food/enforcement.json`

| Authentication | Rate Limit |
|----------------|------------|
| Without API key | 240/min, **1,000/day** |
| With free API key | 240/min, **120,000/day** |

The API uses Elasticsearch query syntax:

```
# Recent Class I food recalls (most severe)
GET /food/enforcement.json?search=classification:"Class+I"+AND+status:Ongoing&limit=100

# Search by date range
GET /food/enforcement.json?search=report_date:[20250101+TO+20260109]

# Search by recalling company
GET /food/enforcement.json?search=recalling_firm:Nestle
```

Response includes `recall_number`, `product_description`, `reason_for_recall`, `classification` (Class I/II/III), `status`, and `distribution_pattern`. Class I indicates a reasonable probability of serious adverse health consequences; these should trigger immediate user alerts.

### UK FSA provides excellent recall data without authentication

**Base URL:** `https://data.food.gov.uk/food-alerts`

```
# List all alerts
GET /food-alerts/id?_view=full

# Filter by type (AA=Allergy Alert, PRIN=Product Recall)
GET /food-alerts/id?type=AA&since=2025-01-01

# Filter by allergen
GET /food-alerts/id?problem.allergen=peanut
```

No API key required. Supports JSON, CSV, and RDF output formats. Alert types: `AA` (Allergy Alert), `PRIN` (Product Recall Information Notice), `FAFA` (Food Alert For Action).

### Other global sources vary in accessibility

| Source | Access Method | Notes |
|--------|---------------|-------|
| **EU RASFF** | Web portal only | No API; manual export via rasff-window portal |
| **Canada CFIA** | JSON data file | `recalls-rappels.canada.ca/.../HCRSAMOpenData.json` |
| **Australia FSANZ** | RSS feed | `foodstandards.gov.au/food-recalls/alerts` |
| **Australia ACCC** | RSS feed | `productsafety.gov.au/rss/recalls.xml` |
| **USDA FSIS** | REST API | Meat/poultry only (complements FDA) |
| **Japan** | Web portal | Japanese language; mandatory reporting since 2021 |

For production systems, implement: scheduled polling of FDA/USDA APIs (every 15-60 minutes), daily refresh of Canada JSON files, and RSS feed monitoring for Australia/NZ. Store all recalls in a unified schema for cross-referencing against scanned barcodes.

---

## Age-based safety rules form the intelligence layer

The rule engine must evaluate products against age-specific thresholds. Here are the critical rules organized by restriction type.

### Food restrictions by age bracket

**Absolute restrictions (flag as CRITICAL):**

| Rule | Age | Reason |
|------|-----|--------|
| Honey | <12 months | Infant botulism from C. botulinum spores |
| Unpasteurized dairy | All children <5 | Listeria risk |
| Raw/undercooked eggs | <5 years, pregnant, elderly | Salmonella |
| Energy drinks | <18 years | AAP recommends complete avoidance |
| Whole grapes, hot dogs | <4 years | Choking (hot dogs = #1 cause of choking deaths) |
| Whole nuts, popcorn | <4 years | Choking hazard |

**Threshold-based restrictions:**

| Nutrient | 0-6mo | 6-12mo | 1-3y | 4-8y | 9-13y | 14-18y | Adults | 65+ |
|----------|-------|--------|------|------|-------|--------|--------|-----|
| **Sodium (mg/day)** | ~110 | ~370 | <1,200 | <1,500 | <1,800 | <2,300 | <2,300 | <2,300 |
| **Added sugar (g/day)** | 0 | 0 | <25 | <25 | <25 | <25 | <50 | <50 |
| **Caffeine (mg/day)** | 0 | 0 | 0 | 2.5mg/kg | <100 | <100 | <400 | <400 |

**Implementation logic:** For each product scan, calculate per-serving values and flag when a single serving exceeds 25% of the daily limit for the selected age group.

### Cosmetic restrictions by age group

**Infants (0-3 years) - avoid these ingredients:**
- All synthetic fragrances and "parfum"
- Essential oils containing 1,8-cineole (eucalyptus, rosemary, peppermint)
- Parabens (precautionary; some banned in EU baby products)
- SLS/SLES sulfates
- Talc (respiratory risk, asbestos contamination concerns)

**Children sunscreen rules:**
- <6 months: Avoid sunscreen entirely; use shade/clothing
- 6+ months: Mineral-only (zinc oxide, titanium dioxide); avoid oxybenzone, octinoxate

**Teen acne products:**
- Salicylic acid: Safe at OTC concentrations (≤2%)
- Retinoids: Only under dermatologist supervision for acne; not for anti-aging

**Pregnancy flag (separate user profile option):**
- AVOID: All retinoids (birth defect risk), high-dose salicylic acid, hydroquinone
- SAFE: Glycolic acid (low%), azelaic acid, vitamin C, mineral sunscreens

### Rule engine data structure

```python
AGE_BRACKETS = {
    "infant_pre_weaning": {"min_months": 0, "max_months": 6},
    "infant_weaning": {"min_months": 6, "max_months": 12},
    "toddler": {"min_years": 1, "max_years": 3},
    "child": {"min_years": 4, "max_years": 12},
    "teen": {"min_years": 13, "max_years": 17},
    "adult": {"min_years": 18, "max_years": 64},
    "elderly": {"min_years": 65, "max_years": None}
}

FOOD_RULES = [
    {
        "id": "honey_infant",
        "ingredient_patterns": ["honey", "miel"],
        "max_age_months": 12,
        "severity": "critical",
        "message": "Honey can cause infant botulism in children under 1 year"
    },
    {
        "id": "sodium_toddler",
        "nutrient": "sodium_100g",
        "max_per_serving_mg": 300,  # ~25% of 1200mg daily limit
        "age_bracket": "toddler",
        "severity": "warning"
    }
]
```

---

## Ingredient intelligence requires multiple reference databases

### Allergen synonym mapping is essential for detection

The FDA "Big 9" allergens (milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy, sesame) and EU 14 allergens require comprehensive synonym databases:

**Milk synonyms:** casein, whey, lactose, lactalbumin, lactoglobulin, ghee, curds, custard, galactose, lactoferrin, recaldent

**Open source allergen databases:**
- **Alleropedia** (GitHub): 13,145 allergen records from COMPARE, AllergenOnline, WHO/IUIS, Allergome
- **Open Food Facts taxonomy:** Normalized allergen tags with synonyms
- **Food-Allergens-CH** (GitHub): Swiss/EU allergen data with German synonyms

### E-number and additive databases

**Free sources:**
- **e-additives.server** (GitHub): REST API with categories (colors, preservatives, emulsifiers)
- **FDA Substances Added to Food database:** Downloadable Excel with GRAS substances
- **Codex GSFA Online:** International additive standards with maximum levels
- **EFSA opinions:** Scientific safety evaluations for EU-approved additives

### Toxicity and safety data

**PubChem** provides free chemical safety information via REST API:
```
GET https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/{CID}/JSON
```
Returns GHS hazard classifications, toxicity data, and safety summaries. Use CAS numbers from CosIng or ingredient databases to look up detailed safety profiles.

---

## Backend architecture should optimize for scan latency and cache freshness

### Recommended API route structure

```
/api/v1/
├── scan/{barcode}           # Primary scan endpoint
├── products/{id}            # Detailed product view
├── products/search          # Search by name/brand
├── safety-check             # POST {ingredients[], age_bracket}
├── recalls/active           # Current recalls
├── recalls/check/{barcode}  # Check specific product
├── allergens/synonyms/{name}
└── users/{id}/preferences   # Allergen profiles
```

### Caching strategy with TTL recommendations

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Product data | 24-72 hours | Changes infrequently |
| Ingredient definitions | 7 days | Static reference data |
| Allergen synonyms | 30 days | Very stable |
| **Active recalls** | **15-60 minutes** | **Critical safety data** |
| User preferences | Session-based | Changes with user action |

**Multi-tier caching architecture:**
1. **L1 (In-memory):** Application LRU cache for hot products
2. **L2 (Redis):** Distributed cache for shared state across instances
3. **L3 (Local DB):** Synced copy of OFF data for offline fallback

### Database schema for core entities

```sql
-- Products table with denormalized safety flags
CREATE TABLE products (
    id UUID PRIMARY KEY,
    barcode VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255),
    ingredients_text TEXT,
    allergens_tags TEXT[],
    nutriments JSONB,
    nutri_score CHAR(1),
    nova_group SMALLINT,
    source VARCHAR(50),
    updated_at TIMESTAMP
);
CREATE INDEX idx_products_barcode ON products(barcode);

-- Recalls with time-series indexing
CREATE TABLE recalls (
    id UUID PRIMARY KEY,
    recall_number VARCHAR(50) UNIQUE,
    product_description TEXT,
    reason TEXT,
    classification VARCHAR(10),
    status VARCHAR(20),
    recall_date DATE,
    source VARCHAR(50),
    affected_barcodes TEXT[]
);
CREATE INDEX idx_recalls_date ON recalls(recall_date DESC);
CREATE INDEX idx_recalls_status ON recalls(status);
```

### Batch processing for recall ingestion

```python
# Scheduled job every 15-60 minutes
async def sync_recalls():
    # Fetch from multiple sources
    fda_data = await fetch_fda_recalls(status="Ongoing", limit=100)
    fsis_data = await fetch_usda_fsis_recalls()
    
    # Normalize to common schema
    recalls = normalize_recalls(fda_data + fsis_data)
    
    # Upsert with deduplication
    for recall in recalls:
        await db.execute("""
            INSERT INTO recalls (recall_number, ...) 
            VALUES ($1, ...) 
            ON CONFLICT (recall_number) DO UPDATE SET ...
        """)
    
    # Invalidate cache
    await redis.delete("recalls:active")
    await publish_event("recalls.updated")
```

---

## Rate limit management prevents API blocking

### External API limits summary

| API | Limit | Strategy |
|-----|-------|----------|
| Open Food Facts | 100/min products, 10/min search | Queue requests, use bulk exports |
| openFDA | 1,000/day (no key), 120,000/day (with key) | Always use API key |
| PubChem | 5 requests/second | Throttle with delay |

### Circuit breaker pattern for resilience

When external APIs fail, implement graceful degradation:
1. **Cached fallback:** Return stale data with `"cached": true, "stale": true` flag
2. **Alternative source:** Failover from API to local database copy
3. **Queue for retry:** Store failed requests for background reprocessing
4. **Partial response:** Return product name/brand without safety analysis

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=30):
        self.failures = 0
        self.state = "closed"  # closed, open, half-open
        
    async def call(self, func, *args):
        if self.state == "open":
            if time_since_last_failure > self.recovery_timeout:
                self.state = "half-open"
            else:
                return await self.fallback(*args)
        
        try:
            result = await func(*args)
            self.failures = 0
            self.state = "closed"
            return result
        except Exception:
            self.failures += 1
            if self.failures >= self.failure_threshold:
                self.state = "open"
            raise
```

---

## Implementation checklist and official resources

**Phase 1 - Core scanning:**
- [ ] Integrate OpenFoodFacts API v2 for food products
- [ ] Integrate OpenBeautyFacts API for cosmetics
- [ ] Implement barcode validation (GTIN-13/EAN)
- [ ] Build local product cache with 24-hour TTL

**Phase 2 - Safety engine:**
- [ ] Build allergen synonym database from Alleropedia + OFF taxonomy
- [ ] Implement age bracket selection in user profiles
- [ ] Create rule engine with food restrictions (honey, choking, caffeine, sodium, sugar)
- [ ] Create cosmetic rules (fragrance, retinoids, sunscreen ingredients)

**Phase 3 - Recall monitoring:**
- [ ] Set up FDA OpenFDA polling (get API key from open.fda.gov)
- [ ] Integrate UK FSA food-alerts API
- [ ] Implement recall-to-barcode matching
- [ ] Build push notification system for active recalls

**Official documentation links:**
- OpenFoodFacts API: `openfoodfacts.github.io/openfoodfacts-server/api/`
- OpenFDA: `open.fda.gov/apis/`
- UK FSA: `data.food.gov.uk/food-alerts`
- CosIng: `ec.europa.eu/growth/tools-databases/cosing/`
- OFF SDKs: Python, Dart/Flutter, Swift, Kotlin, JavaScript available on GitHub

The entire "GoodFor" app can be built without any commercial API dependencies. OpenFoodFacts alone provides product data for 3+ million items across 180+ countries, while government recall APIs offer authoritative safety alerts. The key to a successful implementation lies in thoughtful caching (reducing API load), comprehensive allergen synonym mapping (catching hidden allergens), and age-appropriate rule configuration (translating regulatory guidance into actionable warnings).