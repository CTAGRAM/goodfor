# user-profiles Specification

## Purpose
TBD - created by archiving change track-core-systems. Update Purpose after archive.
## Requirements
### Requirement: multi-profile-management
The system SHALL allow a single authenticated account to create and manage multiple profiles (family members), each with their own name, age, and relationship context.

#### Scenario: Profile management
- **WHEN** editing profiles
- **THEN** multiple profiles can be managed

### Requirement: dietary-restrictions
The system SHALL allow users to attach explicit dietary restrictions (e.g., Vegan, Vegetarian, Gluten-Free, Keto) and specific allergies (e.g., Peanuts, Shellfish) to each family member profile.

#### Scenario: Dietary restrictions
- **WHEN** attaching restrictions
- **THEN** they apply to the profile

### Requirement: safety-cross-reference
The system SHALL cross-reference all product health and safety evaluations against the aggregated dietary restrictions and allergies of the user's active family profiles, displaying explicit warnings if a product violates any profile's rules.

#### Scenario: Cross-reference validation
- **WHEN** checking safety
- **THEN** cross-reference is performed against all profiles

