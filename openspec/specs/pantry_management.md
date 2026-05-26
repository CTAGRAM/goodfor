# Pantry Management

### Requirement: pantry-crud-operations
The system MUST allow users to view, search, and delete ingredients in their home pantry database.

#### Scenario: User checks pantry
- **WHEN** the user opens the Pantry screen
- **THEN** the system SHALL fetch and display all items from the `pantry_items` table grouped by category
- **AND** display color-coded tags for items that are expired or expiring soon.

#### Scenario: User deletes a pantry item
- **WHEN** the user taps the delete icon next to a pantry item
- **THEN** the system SHALL remove the item from the `pantry_items` table and update the list.
