# Recipe Management

### Requirement: recipe-extraction
The system MUST support extracting structured recipes from URLs ( TikTok, Instagram, YouTube, and culinary blogs) or screenshots.

#### Scenario: User imports recipe from URL
- **WHEN** the user pastes a recipe URL and taps import
- **THEN** the system SHALL send the URL to the `extract-recipe` Edge Function
- **AND** scrape details, normalize the ingredients, and save the structured recipe to the database.

#### Scenario: User imports recipe from screenshot
- **WHEN** the user uploads a recipe screenshot from camera or library
- **THEN** the system SHALL send the base64-encoded image to the `extract-recipe` Edge Function
- **AND** extract ingredients, prep/cook times, and steps using Vision AI, saving it to the database.
