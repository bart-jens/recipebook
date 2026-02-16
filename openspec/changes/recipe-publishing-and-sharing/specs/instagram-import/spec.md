## MODIFIED Requirements

### Requirement: Recipes imported from Instagram store source type
The system SHALL save recipes imported via Instagram with `source_type: "instagram"`. **The system SHALL also set `source_name` to the Instagram handle or profile name when available, falling back to "Instagram" when not.**

#### Scenario: Source type is stored
- **WHEN** user saves a recipe imported from Instagram
- **THEN** the recipe record has `source_type` set to `"instagram"`

#### Scenario: Source name from Instagram handle
- **WHEN** user imports a recipe from an Instagram post by @halfbakedharvest
- **THEN** `source_name` SHALL be set to "halfbakedharvest"

#### Scenario: Source name fallback
- **WHEN** user imports a recipe from Instagram but no handle is available
- **THEN** `source_name` SHALL be set to "Instagram"
