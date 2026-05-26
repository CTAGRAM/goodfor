## ADDED Requirements

### Requirement: authentication-flows
The system SHALL provide interfaces for users to sign in, sign up, reset passwords, and recover forgotten passwords using email/password authentication via Supabase Auth.

#### Scenario: User sign-in
- **WHEN** a user enters valid credentials
- **THEN** they are authenticated and redirected to the home screen

### Requirement: session-persistence
The system SHALL securely persist the authentication session locally so users do not need to log in each time they open the application.

#### Scenario: App restart
- **WHEN** the app is closed and reopened
- **THEN** the user remains logged in
