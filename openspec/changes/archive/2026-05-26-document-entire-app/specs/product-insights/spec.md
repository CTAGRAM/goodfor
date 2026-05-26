## ADDED Requirements

### Requirement: product-summary-view
The system SHALL present a structured summary of a scanned product, displaying its overall health score, key macro-nutrients, and matching dietary badges.

#### Scenario: Viewing a product
- **WHEN** a product is loaded
- **THEN** its summary and badges are displayed

### Requirement: ingredient-explanations
The system SHALL provide detailed explanations and a glossary for complex or obscure ingredients found in the product.

#### Scenario: Reading ingredient details
- **WHEN** a user taps on an ingredient
- **THEN** a glossary explanation is shown

### Requirement: healthier-alternatives
The system SHALL recommend healthier alternative products based on the user's scan history and the category of the poorly-scored scanned item.

#### Scenario: Alternative suggestion
- **WHEN** a low-scoring product is viewed
- **THEN** healthier alternatives in the same category are suggested
