# core-algorithm Specification

## Purpose
TBD - created by archiving change track-core-systems. Update Purpose after archive.
## Requirements
### Requirement: health-scoring-algorithm
The system SHALL compute a health score (0-100) using a composite algorithm that accounts for:
1. Macro-nutrient distribution (Protein, Fats, Carbs).
2. Fiber content and Sugar content (penalized beyond thresholds).
3. Nova score penalty for ultra-processed foods.
4. Sodium levels and synthetic additives.

#### Scenario: Computing health score
- **WHEN** a product is scanned
- **THEN** it receives a calculated score

### Requirement: beauty-toxicity-analysis
The system SHALL evaluate cosmetic products against a toxicity database to produce an ingredient safety breakdown, penalizing known endocrine disruptors, allergens, and carcinogens.

#### Scenario: Analyzing cosmetic
- **WHEN** a cosmetic is scanned
- **THEN** it produces an ingredient safety breakdown

### Requirement: vulnerable-population-safety
The system SHALL include safety override warnings if an ingredient (e.g., Retinol in cosmetics, or high caffeine/alcohol in food) poses risks to pregnant or nursing mothers, or young children.

#### Scenario: Safety override
- **WHEN** a vulnerable population is targeted
- **THEN** explicit warnings are shown

