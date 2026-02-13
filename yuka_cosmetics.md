# Yuka's cosmetic evaluation system: a comprehensive technical breakdown

Yuka rates **2 million cosmetic products** using a penalty-based algorithm that scores ingredients from **~12,600 compounds** in its proprietary database, drawing on scientific sources ranging from the SCCS to the EWG Skin Deep database. The app applies the **precautionary principle**, flagging ingredients based on presence alone rather than concentration—a methodology praised by safety-conscious consumers but criticized by cosmetic chemists as oversimplified. With **76-80 million global users** scanning **85 products per second**, Yuka has become a de facto industry force, driving documented reformulations at brands like Caudalie and retailers like Intermarché.

---

## Database architecture and data sources

Yuka built its **proprietary cosmetic database starting January 2018**, departing from the open-source Open Food Facts it originally used for food products. The company explicitly states it has "never used Open Beauty Facts" for cosmetics, instead constructing its own repository through three channels: user contributions (photos of products and ingredient lists), direct brand data sharing via Excel or the Salsify platform, and automated verification systems with manual checks when needed.

The database currently contains approximately **12,600 cosmetic ingredients** and **2 million cosmetic products**, growing at roughly **1,200 new products daily**. When users scan an unlisted product, they can contribute it by photographing the packaging and ingredient list. New or unknown ingredients don't negatively impact product scores—they're flagged for analysis by Yuka's toxicologist Zoé Kerlo, who then adds them to the database with assigned risk classifications.

For ingredient nomenclature, Yuka requires **INCI (International Nomenclature of Cosmetic Ingredients)** format, the standardized naming system managed by the Personal Care Products Council. Contributors must list ingredients separated by commas without additional qualifiers like "organic" or "naturally sourced."

---

## The complete scientific source ecosystem

Yuka draws ingredient risk assessments from three distinct categories of sources, creating a layered evaluation framework.

**Official regulatory organizations** form the primary tier: the **SCCS** (Scientific Committee on Consumer Safety) provides EU cosmetic ingredient opinions; **ECHA** (European Chemicals Agency) supplies REACH regulation data and the Candidate List of Substances of Very High Concern; the **US EPA** offers chemical risk assessments and operates the Endocrine Disruptor Screening Program; **IARC** (International Agency for Research on Cancer) provides carcinogenicity classifications across five groups; **ANSES** (French Agency for Food, Environmental and Occupational Health Safety) contributes French national health assessments; and **AICIS** (Australian Industrial Chemicals Introduction Scheme) covers Australian regulatory perspectives.

**Scientific databases** constitute the second tier: the **SIN List** from ChemSec identifies 900+ Substances of Very High Concern; the **TEDX List** catalogs 1,000+ chemicals showing endocrine disruption evidence in peer-reviewed research; **ED Lists** (edlists.org) launched in 2020 by six EU countries provides three-tiered endocrine disruptor classifications; **DEDUCT** from Danish authorities offers additional endocrine disruptor data; **PubChem** from NIH provides comprehensive chemical compound information; **Skin Deep** from the Environmental Working Group rates 130,000+ personal care products; and **CosIng** (the EU Cosmetic Ingredient Database) contains 15,000+ ingredients with regulatory status.

**Independent research** follows a strict hierarchy: systematic reviews and meta-analyses receive highest priority, followed by cohort studies, case-control studies, animal studies, in vitro studies, and finally expert opinions. Yuka uses the **Klimisch rating system**—developed in 1997 to assess toxicological data reliability—to evaluate study quality, prioritizing Klimisch scores of 1 (studies following validated test guidelines under Good Laboratory Practice) and 2 (mostly guideline-compliant studies) while treating scores of 3-4 only as supporting evidence.

---

## The scoring algorithm decoded

Yuka's cosmetic scoring operates on a **0-100 scale** with four rating categories: **Excellent** (75-100), **Good** (50-74), **Mediocre** (25-49), and **Bad** (0-24). The fundamental principle: **the highest-risk ingredient determines the maximum possible score**.

### Ingredient risk classification

Every ingredient receives one of four risk levels based on potential endocrine disruption, carcinogenic potential, allergenic properties, irritant effects, and environmental pollutant status:

| Risk Level | Color | Maximum Score |
|------------|-------|---------------|
| Risk-free | Green | 100/100 |
| Low risk | Yellow | 100/100 |
| Moderate risk | Orange | 49/100 |
| Hazardous | Red | 24/100 |

### Penalty calculations for green/yellow-only products

Products containing only risk-free and low-risk ingredients start at **100 points** with guaranteed scores of at least 50/100:

- **-10 points**: Potential carcinogen or endocrine disruptor at low risk (yellow)
- **-7 points**: Allergen, irritant, other health effect, or pollutant at low risk (yellow)

### Penalty calculations when orange/red ingredients present

When moderate or hazardous ingredients appear, the score ceiling drops and different penalty values apply:

For hazardous (red) ingredients: **-12 points** for carcinogens/endocrine disruptors, **-8 points** for allergens/irritants/pollutants. For moderate (orange) ingredients: **-6 points** for carcinogens/endocrine disruptors, **-4 points** for allergens/irritants/pollutants. For low-risk (yellow) ingredients in products with higher-risk components: **-3 points** for carcinogens/endocrine disruptors, **-2 points** for other risk types.

**Critical rule**: When an ingredient carries multiple risk classifications, only the highest penalty applies. Products with three or fewer ingredients use modified lower penalties, since a single risky ingredient represents a proportionally larger formula share.

### Recommendation engine

Products scoring "Mediocre" or "Bad" trigger alternative suggestions based on: category match (same product type), country availability, and product score in descending order. The algorithm limits products from the same brand to ensure diversity, and **systematically excludes any product containing hazardous (red) ingredients** from recommendations. Notably, brands cannot pay for placement—selections remain "totally neutral and objective."

---

## Technical infrastructure: Scandit and mobile architecture

Yuka's barcode scanning relies on an **8+ year partnership with Scandit**, whose SDK powers the app's ability to scan **85 products per second** across **20,000+ device models**. The AI-powered scanning engine has processed **8.3 billion total scans** through early 2025.

CTO François Martin tested and rejected Apple's native iOS scanning (poor low-light performance), Google Firebase Android scanning (slow and orientation-dependent), and open-source alternatives (unreliable with damaged codes). Scandit's technical capabilities include: omnidirectional scanning at any angle, super resolution for tiny barcodes, performance in low-light and glare conditions, handling of damaged/torn barcodes, support for **30+ barcode symbologies** (EAN, UPC, QR, DataMatrix, etc.), and OCR fallback for unreadable barcodes.

The mobile app stack reportedly includes **Swift** for iOS, **Kotlin** for Android, **Node.js** backend on **AWS cloud infrastructure**, with database options including MongoDB, Cassandra, HBase, and Postgres. The app maintains **4.8-star ratings** on both iOS (81,000 reviews) and Android (168,000 reviews).

---

## Company structure and the independence model

Three co-founders launched Yuka after winning first place at a February 2016 Food Hackathon: **Benoît Martin** (40, ESDES Business School graduate, handles legal and financial matters, self-taught Android developer); **François Martin** (35, ECE engineering degree, CTO and iOS developer); and **Julie Chapon** (35, EDHEC Business School, leads communications, scientific team, and US development).

The company—legally **Yuca SAS**, registered at 14 Rue de Turbigo, Paris—employs **15 people** and achieved **B Corp certification in February 2024** with a score of **93.2 points**. In April 2023, Yuka became a **"société à mission"** (benefit corporation) under French law. The company reached profitability in 2023 with **€3.8 million revenue** and nearly **€1.5 million profit**.

Yuka's independence rests on three pillars: **no advertising** (brands cannot pay for product promotion), **no influence** (scores generated independently without outside input), and **no data sales** (user data kept strictly confidential). Revenue comes exclusively from **premium subscriptions** (€10-25/year depending on region and chosen price tier) and sales of "The Healthy Eating Guide" book in France. The company publishes its **balance sheet publicly** and annual mission reports reviewed by independent third parties.

The scientific team centers on **Zoé Kerlo**, Yuka's toxicologist who analyzes new ingredients and continually updates the algorithm with peer-reviewed studies. Supporting staff includes food nutrition engineer **Gabriela Mourad Vicenssuto** and external nutritionist collaborator **Anthony Berthou**.

---

## App features: free versus premium tiers

Free users access core functionality: barcode scanning for both food and cosmetics, detailed product data sheets with color-coded scores, recommendations for poorly-rated items, basic scan history, favorites, and the ability to contribute unlisted products. Premium subscribers (starting at **$10-15/year** in the US, with sliding-scale pricing offering identical features at multiple price points) unlock: **keyword search** without barcode scanning, **offline mode** covering most frequently scanned products, food preference alerts (gluten, lactose, vegan, palm oil, etc.), and **unlimited history** across the full year.

The **"Call-out" feature**, launched November 2024 in France, USA, Spain, and Italy, enables users 18+ to directly contact brands using high-risk additives via pre-drafted messages on email, X (Twitter), Instagram, and LinkedIn. The feature targets **81 additives** across **3,100 brands** whose flagged products receive the most scans, with a counter showing total consumers who have called out each brand.

---

## The precautionary principle controversy

Yuka explicitly states: "Although ingredients may be present in cosmetics at levels that comply with current standards, and therefore considered safe by health authorities, **Yuka applies the precautionary principle** and alerts consumers about potential health risks, **even if they are still under suspicion**."

This philosophy generates the most significant criticism. Cosmetic chemist **Perry Romanowski** (The Beauty Brains) argues Yuka "is not a regulatory authority and its rating system is not based on science... Apps like Yuka typically flag ingredients as 'bad' based on the presence of substances listed on various watchlists, even if the ingredient in question is present in minuscule, legally permitted and non-hazardous amounts."

**Jane Tsui** (@JaneTheChemist, 200K+ followers) states: "The rating system...makes no sense because it doesn't take into consideration percentage within a formula. This app capitalizes on fear to help consumers make their decisions."

**Dr. Michelle Wong** (Lab Muffin Beauty Science, chemistry PhD) called such apps "garbage" and "pseudoscience," comparing using them to "trying to rate the taste of food from the ingredient list."

The core methodological limitations cosmetic chemists identify: Yuka doesn't know actual ingredient concentrations (brands don't disclose percentages); it evaluates ingredients individually rather than within formulation context; the same ingredient can behave differently depending on delivery systems and product matrices; and products using proven active ingredients like retinol receive poor scores despite clinical efficacy. Brand founder Josh Rosebrook notes that brands following EU regulations must list essential oil allergens separately—which Yuka penalizes—while non-compliant brands listing only "essential oils" receive higher scores.

Yuka acknowledges limitations: "only provides opinions on the potential risks," "cannot guarantee absolute accuracy," and "takes a precautionary approach." The company emphasizes that its toxicologist constantly updates ratings as new science emerges.

---

## Industry transformation and brand reformulations

Yuka's influence on the cosmetic and personal care industry is documented and substantial.

**Caudalie** (French skincare) went from **65% to 99% highly-rated products** over five years, now refusing to use 73 ingredients and displaying Yuka ratings directly on product pages. CEO Mathilde Thomas treats Yuka scores as key performance indicators.

**Intermarché** (French retailer) reformulated **2,300+ private-label products**, removed **142 controversial additives**, and achieved an average **4-point improvement** in Yuka scores across their range. CEO Thierry Cotillard stated: "The enthusiasm for the app is a fundamental trend. As a retailer, it is essential to be proactive in having the highest rated products possible."

**Nestlé** uses Yuka ratings in performance indicators; their Nutrition Director stated Yuka "is pushing us to speed up improvements to our products, simplify our ingredient lists and build out our organic and plant lines."

Contract manufacturers have adapted: **Medpak Solutions** now offers "Yuka-compliant formulation" as a specialized service with R&D protocols built around ingredient-scoring apps, curated lists of alternatives to flagged ingredients, and in-house testing to anticipate Yuka ratings.

Consumer behavior data from Yuka's 20,000+ respondent US study shows: **94%** stopped purchasing products flagged with hazardous additives; **92%** avoid products receiving poor ratings; **56%** stopped buying 10+ products since joining; and **80%** reported improved skin/hair health thanks to Yuka.

---

## Regulatory landscape and regional considerations

Yuka references EU Cosmetics Regulation (EC) No 1223/2009 and cites SCCS opinions as primary European guidance. The app acknowledges regulatory differences between EU and US markets but cannot guarantee real-time updates to local regulatory changes at member-state level.

The company has achieved regulatory influence: successful French government petition to reduce nitrates in charcuterie, three won lawsuits against the French charcuterie lobby (FICT) with courts recognizing nitrite risks and Yuka's right to inform the public, and over **500,000 petition signatures** for a nitrite ban. In Italy, a 2021 Competition Authority investigation resolved with transparency disclosure requirements.

---

## Conclusion

Yuka represents a paradigm shift in cosmetic consumer information—**76+ million users** now have instant access to ingredient risk assessments previously accessible only to industry professionals. The app's penalty-based scoring system, drawing on legitimate scientific sources from SCCS to the SIN List, creates real market pressure that has driven documented reformulations at major brands.

Yet the fundamental tension remains unresolved: Yuka's **presence-based evaluation** conflicts with the toxicological principle that dose determines toxicity. Cosmetic chemists rightly note that a 0.1% preservative flagged as "hazardous" may be safer than an untested "clean" alternative. The app's precautionary philosophy serves consumers seeking to minimize uncertain risks but oversimplifies the complex safety assessments that regulatory bodies like SCCS perform.

The industry's response—reformulating to optimize Yuka scores rather than challenging the methodology—suggests the app has achieved a kind of de facto regulatory power through consumer influence. Whether this ultimately improves cosmetic safety or simply shifts formulations toward "perceived clean" ingredients with less safety data remains the open question that neither Yuka's supporters nor its cosmetic chemist critics have definitively answered.