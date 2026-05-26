# loyalty-wallet Specification

## Purpose
TBD - created by archiving change document-entire-app. Update Purpose after archive.
## Requirements
### Requirement: loyalty-card-storage
The system SHALL allow users to store digital representations of supermarket loyalty cards by inputting or scanning their membership barcode.

#### Scenario: Adding a card
- **WHEN** a barcode is entered
- **THEN** the card is saved to the wallet

### Requirement: display-loyalty-barcode
The system SHALL render the loyalty card as a scannable barcode or QR code on the screen, optimizing screen brightness for physical store scanners.

#### Scenario: Displaying card
- **WHEN** a card is selected
- **THEN** a large barcode is displayed for scanning

