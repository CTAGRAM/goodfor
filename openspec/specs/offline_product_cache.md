# Offline Product Cache

### Requirement: offline-cache-fallback
The system MUST check the local offline database cache first before requesting product details from the OpenFoodFacts API, and SHALL cache newly fetched products locally.

#### Scenario: Barcode scan when offline or cache hit
- **WHEN** the user scans a product barcode or queries it by code
- **THEN** the system SHALL check if the product details are available in local AsyncStorage
- **AND** if available, the system SHALL serve the product data from the offline cache with the `isOffline` flag set to true.

#### Scenario: Barcode scan cache miss
- **WHEN** the user scans a product barcode and it is not found in AsyncStorage
- **THEN** the system SHALL fetch product data from the world.openfoodfacts.org API
- **AND** if the request is successful, the system SHALL parse, normalize, and save the product details to AsyncStorage for future offline lookups.
