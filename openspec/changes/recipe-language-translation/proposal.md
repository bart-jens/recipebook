## Why

Recipes are imported in many languages but there's no way to know what language a recipe is in, and no way to translate. Auto-translation is a natural premium feature: store the original language, display it, and offer on-demand translation as a paid feature.

This also improves the browsing experience — users can see at a glance whether a recipe is in a language they read, before opening it.

## What Changes

### Phase 1: Store Original Language (free)
- **Add `language` column to recipes table** — ISO 639-1 code (en, nl, fr, es, ja, etc.), nullable
- **Auto-detect language during import** — URL import: check `<html lang>` attribute; Photo/Instagram import: add language detection to the AI extraction prompt; Manual entry: default to user's browser/device locale
- **Display language badge on recipe cards and detail pages** — Small tag showing "Dutch", "English", etc.
- **Language filter on discover page** — Filter public recipes by language

### Phase 2: Auto-Translation (premium)
- **`recipe_translations` table** — Stores translated versions: recipe_id, language, title, description, instructions, ingredients (JSON), translated_at
- **Translate button on recipe detail** — Premium users can request a translation to their preferred language
- **Translation via AI** — Use Claude/Gemini to translate recipe text while preserving cooking terminology
- **Translated view toggle** — Switch between original and translated version

### Phase 3: Community Translations (future)
- Allow users to submit translation corrections
- Verified translations get priority over AI translations

## Monetization

- **Free:** See original language badge, browse/filter by language
- **Premium:** Auto-translate any recipe to your language, save translations
- **Creator monetization angle:** Creators who write in non-English languages get wider reach via translation, making the platform more attractive

## Capabilities

### New Capabilities
- `recipe-language`: Language detection, storage, and display for recipes
- `recipe-translation`: AI-powered recipe translation (premium feature)

### Modified Capabilities
- `recipe-crud`: Add language field to recipe creation and editing
- `recipe-publishing`: Include language in public recipe metadata and share cards

## Impact

**Backend / Supabase:**
- New migration: add `language TEXT` column to `recipes` table
- New migration: `recipe_translations` table with RLS (phase 2)
- Update recipe import RPCs/logic to include language detection

**Frontend (Web + Mobile):**
- Language badge component on recipe cards and detail pages
- Language filter on discover page
- Translation UI on recipe detail (phase 2)
- Language field in recipe form (optional, with auto-detection)

**AI/API:**
- Update photo/Instagram extraction prompts to detect and return language
- Translation endpoint using Claude or Gemini (phase 2)

**Free vs Premium:**
- Language detection and display: **free**
- Auto-translation: **premium**
- Community translation corrections: **free** (contributes to platform value)

## IP Considerations

- Translations are derivative works — the translated text stays within EefEats, associated with the original recipe
- For imported (private) recipes: translations are personal use only, stored privately
- For public recipes: translations are public but attributed to original author
- Users cannot export/copy translated text of other people's recipes
