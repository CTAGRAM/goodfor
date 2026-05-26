## ADDED Requirements

### Requirement: shopping-basket-management
The system SHALL allow users to add products to a digital shopping basket and adjust quantities.

#### Scenario: Modifying basket
- **WHEN** an item is added or removed
- **THEN** the basket total is updated

### Requirement: basket-finalization
The system SHALL provide a checkout/finalize flow to mark a shopping trip as completed and log it to the user's history.

#### Scenario: Finalizing basket
- **WHEN** the user finalizes the basket
- **THEN** it is saved to history and cleared

### Requirement: weekly-offers-integration
The system SHALL surface weekly offers and promotions from integrated supermarkets directly within the shopping or discovery experience.

#### Scenario: Viewing offers
- **WHEN** navigating to offers
- **THEN** current supermarket promotions are shown
