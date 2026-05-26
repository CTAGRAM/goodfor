# shopping-list Specification

## Purpose
TBD - created by archiving change document-entire-app. Update Purpose after archive.
## Requirements
### Requirement: shopping-list-management
The system SHALL allow users to manually add, edit, and remove generic grocery items from a persistent shopping list.

#### Scenario: Adding to list
- **WHEN** the user types an item
- **THEN** it is appended to the shopping list

### Requirement: check-off-items
The system SHALL allow users to toggle the completion status of items while physically shopping.

#### Scenario: Checking off
- **WHEN** an item is tapped
- **THEN** it is marked as checked and moved to the bottom

