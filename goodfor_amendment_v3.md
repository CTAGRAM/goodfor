GoodFor App amendments

1. I do not want the verification code to go to the users email, can we do telephone number text instead? It is an easier flow for the user. Email is too long for the user to go into their emails to get a verification code. We do want the user to just login automatically using Apple and Google play store.
2. When I open the scanm the instructions which starts “Make sure the barcode is well-lit and…” the text is cut off at the bottom and cant see it.
3. Do we have the alert notifications for health and call back on products in the users country?
4. On the analysis page for a product:
a. Add a 1-line decision summary (above the score). At the very top, add a plain-English verdict.
b. “What prevents a perfect score?”. Directly under the score bar, add: Why not 100? E.g. • Contains EU fragrance allergens (linalool, limonene) • Limited long-term clinical data for fragrance blends
c. 36 natural ingredients” is misleading (even if true). Why this is risky
“Natural” ≠ safe. Users may infer:

“Natural = good, synthetic = bad”

Fix: reframe the section

Replace “Natural Ingredients – 36 detected” with:

Ingredient Composition

36 total ingredients

6 fragrance compounds (EU-regulated allergens)

1 preservative (phenoxyethanol – within safe limits)
Then add a tooltip on “natural”: “Natural ingredients are not automatically safer. Safety depends on dose, exposure, and individual sensitivity.”

d. make concerns explicit and ranked
Change: ⚠️ 3 concern(s)

To: ⚠️ 3 considerations for sensitive skin

Then list them inline e.g. :

• Linalool (fragrance allergen)
• Limonene (fragrance allergen)
• Parfum (fragrance blend – composition undisclosed)
Severity badges:

• 🟡 Mild (general population)
• 🟠 Moderate (sensitive skin)
e. Ingredient glossary: good tone, but lacks personal relevance. We nee dto add impact on personal context of user:
Right now:

“Glycerin – Generally safe”

But for this user, it would be more powerful to say:

“Safe for your skin type and age. No known irritation risk.”

Fix: add “For you” tags

Every ingredient card should optionally show:

✅ Safe for you

⚠️ May irritate sensitive skin

🚫 Avoid (if allergen)

f. Clinical Evidence: 8/15 – Limited data” needs explanation
This is actually excellent transparency, but it risks being misunderstood.

User interpretation risk

“Limited data?? So is this unsafe?”

Fix: add context tooltip

Next to “Clinical Evidence”: ℹ️ “This score reflects the availability of long-term human studies on cosmetic fragrance mixtures — not evidence of harm.”

And optionally: “Most cosmetic products fall in this range.”

g. Safety by age: excellent feature, but burying the insight
This is one of your strongest differentiators, but it’s understated.

Improvement - Under “Age suitability – Suitable for selected age” add: “Not recommended for infants due to fragrance exposure.”

h. Safety Summary should be more actionable
i. Current: “Key concerns: LINALOOL, LIMONENE. Always verify with healthcare provider if unsure.”
This feels generic and slightly defensive.

Fix: make it practical. Replace with:

Safety summary
This product is safe for adult use.
If you have fragrance sensitivity, patch test before regular use.

j. One final, high-impact addition: “Who should avoid this?” Add a small section near the bottom:
Who should be cautious

- People with fragrance allergies
- Very sensitive or eczema-prone skin
- Infants and toddlers
5. The same product scans cannot be used and applied to other profiles. So the user will have to scan the same product to get a score for another profile – this doesn’t make sense. The user should be able to scan a product once and get insights for the whole family either by having it on family mode or specific user.
Add a Profile Switcher on the analysis page. Under the main score:

Viewing safety for:

👤 Karim (Adult) ▾

Tap → Switch to:

👶 Child (2y)

👩 Partner (Sensitive skin)

👪 Family overview

Add a Family Safety Summary:

Family safety at a glance

• ✅ Safe for adults
• ⚠️ Caution for sensitive skin
• 🚫 Not recommended for infants
6. There are no environmental impact of products. Add a standalone section below health analysis:
🌍 Environmental Impact

Eco Score: B
Packaging: Plastic (recyclable)
Processing footprint: Moderate
Ingredient sourcing: Mixed (plant-based oils, synthetic fragrance)

Start with:

Eco-Score (if available)

Packaging type + recyclability

Processing intensity (leveraging NOVA)

Palm oil / high-risk sourcing flags (if known)

Add a tooltip: “Environmental impact is assessed separately from health. A product can be safe for you but less ideal for the planet, and vice versa.” Eco does NOT change the health score.

 

So the structure for Beauty Product analysis is:

• Plain-English Safety Verdict
• Profile Selector (Individual / Family)
• Overall Health & Safety Score
• Why This Isn’t a Perfect Score
• Key Considerations for You
• Ingredient Composition
• Ingredient Safety Breakdown
• Clinical Evidence & Data Confidence
• Regulatory & Compliance Status
• Environmental Impact
• Usage & Frequency Guidance
• Who Should Avoid or Be Cautious
• Safer Alternatives (Same Category as scanned product)
 

7. For food products in the analysis. What’s happening now - Everything is shown per 100g, exactly like Nutri-Score.
Why this is a problem

Users don’t eat “100g of everything”:

- Crisps, sauces, spreads, snacks get unfairly punished
- This is one of the loudest Yuka complaints you listed
Fix: add a Portion Reality toggle

Under the Nutri-Score card:

Shown per:
◉ 100g (label standard)
○ Typical portion (30g)

When toggled:

Keep Nutri-Score letter fixed (regulatory)

Update numbers + penalties visually to show real intake

Example:

Sodium:

- 472mg /100g ❌
- ~140mg per portion ⚠️
This single toggle massively increases trust.

8. Explain why Nutri-Score = D (not just the math)
Right now users see:

Nutri-Score D

…and a list of positives/negatives.

But they still ask:

“So… should I eat this or not?”

Fix: add a 1-line Nutri-Score interpretation

Directly under the D badge:

Why D?

High sodium and energy density outweigh moderate protein and fiber.

9. Add a “Who should limit this?” section (food-specific)
This is where personalization shines for food.

Below the Nutri-Score card, add:

⚠️ Who should limit this

- People with high blood pressure (sodium)
- People on low-calorie diets
- Frequent consumption not recommended
10. Add Ultra-Processed / NOVA clearly (you already have it — surface it)
Given your competitor critique, this is non-negotiable

Add a section:

🏭 Processing Level

NOVA group: 4 (Ultra-processed)

Tooltip:

Ultra-processed foods are industrial formulations often high in salt, fat, or additives. Limiting frequency is generally recommended.

11. Add fat quality, not just fat quantity (key science gap)
You already show saturated fat — good.

What’s missing:

Type of fats

Trans fats risk

Seed oil transparency

Add a small subsection under fats:

Fat profile

Saturated fat: 2.4g ⚠️

Trans fats: Not declared / Likely present

Main oils: Sunflower / Canola (if applicable)

Tooltip: Fat quality matters as much as total fat. Trans fats and heavily refined oils may increase cardiovascular risk.

12. Add a “Frequency guidance” (extremely powerful, very rare)
Instead of just scores, answer: “How often is this okay?”

Add at the bottom:

🕒 Consumption guidance

- Occasional (not daily)
- Suitable as a snack, not a staple
13. Add environmental impact for food (consistency with non-food)
Since you’re adding Eco elsewhere, food must match.

🌍 Environmental Impact (Food)

- Processing footprint: High
- Packaging: Plastic (recyclable)
- Ingredients sourcing: Mixed
Again: separate from health.

 

So the structure for food insights is:

•  Plain-English verdict

•  Nutri-Score + explanation

•  Per 100g ↔ per portion toggle

•  Who should limit this

•  Processing (NOVA)

•  Fat & ingredient quality

•  Consumption frequency guidance

•  Environmental impact

•  Alternatives (same category as scanned product)

 

 

Profile  - we need to add more customisation for the profile pages for all the family members

1. Add Region (implicit or visible)
2. •  Add “Severity” (optional):
3. Mild / Moderate / Severe
(Used internally to adjust warnings, not scare users)
•  Add “Avoid always” vs “Flag only”:

Some users want info, not automatic downgrades

4. For skin type, add:
Skin Type (keep)

• Normal
• Dry
• Oily
• Combination
• Sensitive
5. Skin Conditions (keep, but reframe)
Change heading from:
“Skin Conditions”
To:
Skin Concerns (optional)
This avoids medical framing.
Add tooltips like:
Used to highlight ingredients that may help or worsen this concern.
6. Pregnancy & Nursing (keep, but add clarity)
Add a subtle info icon:

We flag ingredients commonly advised to avoid. Always follow medical guidance.

7. Add Usage Sensitivity Toggles (HUGE value, low effort)
New section:

🧪 Sensitivity Level

Helps adjust how cautious we are with warnings.

Options:

- Standard sensitivity (default)
- Extra cautious
- Very sensitive
8. Custom preferences should be - Ingredients you personally prefer to avoid (not necessarily unsafe)
 

 