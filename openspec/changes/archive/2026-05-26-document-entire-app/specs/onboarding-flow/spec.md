## ADDED Requirements

### Requirement: new-user-onboarding
The system SHALL guide newly registered users through an onboarding flow to collect their basic profile, dietary preferences, and primary health goals.

#### Scenario: Completion of onboarding
- **WHEN** a user completes the setup steps
- **THEN** their profile is populated in the database

### Requirement: permission-requests
The system SHALL request camera and notification permissions contextually during the onboarding sequence or immediately before they are first needed.

#### Scenario: Camera permission
- **WHEN** the camera step is reached
- **THEN** the native permission dialog is triggered
