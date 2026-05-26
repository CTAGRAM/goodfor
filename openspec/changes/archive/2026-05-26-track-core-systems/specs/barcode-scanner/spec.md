## ADDED Requirements

### Requirement: barcode-camera-scanning
The system SHALL provide a camera interface to scan product barcodes using the device camera. 

#### Scenario: Scanning barcode
- **WHEN** the camera interface is opened
- **THEN** the user can scan barcodes

### Requirement: offline-cache-fallback
The system SHALL fall back to a local offline cache of common products if network connectivity is unavailable during a scan.

#### Scenario: Offline cache usage
- **WHEN** offline
- **THEN** the local cache is used

### Requirement: product-parsing-and-history
The system SHALL process scanned barcodes via the backend product resolution API. Recognized products MUST be displayed in a product summary view and saved to the user's scan history. Unrecognized barcodes SHALL prompt the user to manually enter product details or take a photo of the ingredients list.

#### Scenario: Unrecognized product handling
- **WHEN** an unrecognized barcode is scanned
- **THEN** the user is prompted to enter details
