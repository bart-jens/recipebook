## Context

Photo-imported recipes have a bare optional `source_name` text input that users easily skip. The field can't be edited after creation. The book cover scanner exists on mobile but is easy to miss. The `/api/extract-book-cover` endpoint has no authentication, unlike all other extract routes.

The `source_name` column already exists on the `recipes` table — no schema changes needed. The `updateRecipe` server action doesn't include `source_name` in its update payload. The `RecipeForm` component (shared between new/edit on both platforms) has no `source_name` field.

## Goals / Non-Goals

**Goals:**
- Make source attribution the natural, easy path (not a chore) during photo import
- Promote the book cover scanner as the primary attribution method
- Allow editing `source_name` after creation on both web and mobile
- Fix authentication gap on `/api/extract-book-cover`

**Non-Goals:**
- Making source mandatory (it stays optional via "Skip for now")
- "My own recipe" source type conversion to `source_type: 'manual'` (future)
- Cookbook shelf / collection feature (future — this lays the data foundation)
- "You skipped source" reminders or nudges after save
- Changing how URL or Instagram imports handle source

## Decisions

### 1. Source attribution as a dedicated step, not a form field

Instead of a small optional text input above the recipe form, source attribution becomes a visually distinct card/section with clear hierarchy:

1. Book cover scanner button (primary action, most prominent)
2. Text input for manual entry (secondary)
3. "Skip for now" link (tertiary, explicit choice)

**Why**: The current layout buries the source field. Making it a dedicated visual block makes users *notice* it. The scanner removes friction — one tap to auto-fill is easier than typing.

**Alternative considered**: Making it a full-screen step before the recipe form. Rejected — too heavy. A prominent card within the review screen hits the right balance.

### 2. Add `source_name` to RecipeForm as an optional prop

Rather than building source editing into every page separately, extend `RecipeForm` to accept and display `source_name` when provided. The field appears in the form only when:
- Editing an existing recipe (always show, editable)
- The recipe already has a `source_name` value

On the import-photo pages, source is handled by the dedicated attribution section (not the form), so `RecipeForm` won't show it there.

**Why**: Single component change covers both web and mobile edit flows. Keeps the new recipe form clean (manual recipes don't need source attribution).

**Web**: `RecipeForm` gets optional `sourceName` / `onSourceNameChange` props. The edit page passes the existing value.

**Mobile**: Same pattern — `RecipeForm` component gets optional `sourceName` prop.

### 3. `updateRecipe` action includes `source_name`

The server action simply reads `source_name` from formData and includes it in the Supabase update. No validation needed — it's a free-text field, nullable.

### 4. Auth fix is straightforward middleware pattern

Add the same `createClient()` + `auth.getUser()` check used by `extract-photo` and `extract-instagram` routes. Return 401 if not authenticated.

### 5. Web gets book cover scanning too

Currently only mobile has the scanner. Web should get it via the same file upload mechanism (take photo or choose file). Calls the same `/api/extract-book-cover` endpoint.

**Why**: Platform parity. Web users import cookbook photos too.

## Risks / Trade-offs

**[Users might always hit "Skip for now"]** → Acceptable. The scanner makes attribution easy enough that most users who *do* have a cookbook will use it. We're optimizing for data quality from willing users, not forcing compliance.

**[Book cover scanner accuracy]** → Gemini 2.0 Flash is good at reading text from book covers. Edge cases (handwritten titles, non-English) may fail — the text input is always available as fallback.

**[Adding source_name to edit form adds visual weight]** → The field only appears for recipes that already have source data, or as a subtle optional field on edit. It won't clutter the new recipe form.
