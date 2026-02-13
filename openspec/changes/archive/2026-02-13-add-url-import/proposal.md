## Why

Manually typing recipes is tedious. Most of the time, users find recipes on websites and want to save them quickly. Recipe websites are notoriously bloated with life stories, ads, and SEO filler — users just want the recipe data. URL import parses the structured schema.org/Recipe markup that most recipe sites include, extracts only the recipe data, and lets users review before saving.

## What Changes

- Add an "Import from URL" option on the recipe list page
- Build a server-side URL fetcher that extracts schema.org/Recipe JSON-LD from any URL
- Parse the structured data into our recipe format (title, description, instructions, ingredients, times, servings)
- Parse ingredient strings into structured quantity/unit/name/notes
- Show a pre-filled recipe form for user review before saving
- Set source_type to "url" and store the source URL

## Capabilities

### New Capabilities
- `url-import`: Fetch and parse recipe URLs using schema.org/Recipe markup, extract structured recipe data

### Modified Capabilities
- `recipe-crud`: Add URL import entry point to recipe list page, support pre-filling the recipe form from imported data

## Impact

- New server-side logic for URL fetching and parsing (no new API dependencies — just HTTP fetch + HTML parsing)
- New page: `/recipes/import-url`
- Modifies recipe list page (adds import button)
- Need an HTML parsing library for extracting JSON-LD from pages
