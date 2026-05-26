## ADDED Requirements

### Requirement: vision-based-scanning
The system SHALL allow users to take a photo of their fridge or pantry shelves.

#### Scenario: Snap photo
- **WHEN** using the fridge scanner
- **THEN** photo is taken

### Requirement: vision-item-extraction
The system SHALL submit the compressed photo to a Vision API (e.g., GPT-4 Vision) with a prompt instructed to extract a JSON list of visible grocery items, estimating quantities and categorizing them appropriately.

#### Scenario: Processing items
- **WHEN** photo is analyzed
- **THEN** a list of items is extracted

### Requirement: bulk-pantry-import
The system SHALL present the extracted items to the user for review. Upon confirmation, the system SHALL insert all reviewed items into the user's pantry inventory table in the database in a single transaction.

#### Scenario: Saving to pantry
- **WHEN** user confirms extraction
- **THEN** items are saved to the database
