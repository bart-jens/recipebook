## ADDED Requirements

### Requirement: Instagram source type support
The recipe creation flow SHALL accept `source_type: "instagram"` when saving recipes imported from Instagram. The source type SHALL be stored in the recipe record.

#### Scenario: Instagram source type saved
- **WHEN** a recipe is submitted with `source_type` set to `"instagram"`
- **THEN** the recipe record SHALL have `source_type` equal to `"instagram"`
