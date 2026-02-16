## Context

EefEats currently has a simple interaction model: `is_favorite` (boolean on recipes) and `recipe_ratings` (rating + cooked_date + notes). These conflate "want to cook," "love it," and "cooked it" into muddy signals. As we build social features (activity feed, discover), we need clean, gated interactions that carry real meaning.

Current schema:
- `recipes.is_favorite` — boolean, overloaded to mean both "want to cook" and "love it"
- `recipe_ratings` — combined cooking log + rating, with `cooked_date`, `rating (1-5)`, `notes`

Users: Currently Bart + wife (invite-only). Building for scale but deploying at small scale first.

## Goals / Non-Goals

**Goals:**
- Separate five distinct recipe interactions with clear data model boundaries
- Enforce "must have cooked" gates on rating and favoriting at the database level
- Make "Cooked It" the primary social signal for future activity feed
- Migrate existing data cleanly (no data loss, no user action required)
- Update both web and mobile UI to reflect the new model

**Non-Goals:**
- Activity feed (separate change, builds on this)
- Social sharing of cook events (future — this change creates the signals, not the distribution)
- Cooking streaks or gamification
- Changes to recipe creation, editing, or import flows

## Decisions

### 1. Separate `cook_log` table instead of extending `recipe_ratings`

**Decision:** Create a new `cook_log` table. Decouple cooking from rating.

**Rationale:** A cook event and a rating are different acts. You might cook something three times before rating it. You might log a cook without wanting to rate. The cook log becomes the social signal ("Eef cooked Pad Thai"), while ratings stay as quality assessments. Separating them makes each query clean and makes the cooking gate enforceable via FK.

**Alternative considered:** Making `rating` nullable in `recipe_ratings` and treating rows with `cooked_date` but no rating as "cook-only" entries. Rejected because it muddies the table's purpose and makes queries awkward.

```
cook_log
├── id (uuid PK)
├── user_id (uuid FK → auth.users)
├── recipe_id (uuid FK → recipes)
├── cooked_at (timestamptz, default now())
├── notes (text, nullable — "doubled the garlic")
└── created_at (timestamptz)

Unique constraint: NONE (can cook same recipe multiple times)
Index: (user_id, recipe_id) for gate checks
```

### 2. `saved_recipes` table for bookmarking other people's public recipes

**Decision:** Create a `saved_recipes` junction table. A user's own recipes (originals + imports) are implicitly "saved" — they're in the collection by ownership. `saved_recipes` is only for bookmarking OTHER users' public recipes into your collection.

**Rationale:** The unified "saved" view is: `recipes WHERE created_by = me` UNION `saved_recipes WHERE user_id = me`. This avoids duplicating recipe rows and keeps ownership clear.

```
saved_recipes
├── id (uuid PK)
├── user_id (uuid FK → auth.users)
├── recipe_id (uuid FK → recipes)
├── created_at (timestamptz)
└── UNIQUE (user_id, recipe_id)
```

RLS: Users can save public recipes. Users can view/delete their own saves.

### 3. `recipe_favorites` table instead of boolean column

**Decision:** Use a `recipe_favorites` junction table rather than a boolean on `recipes`.

**Rationale:** Users can favorite both their own recipes AND saved public recipes. A boolean on `recipes` wouldn't handle favoriting someone else's public recipe. The junction table also allows enforcing the cooking gate via a check that `cook_log` has at least one entry for this user+recipe.

```
recipe_favorites
├── id (uuid PK)
├── user_id (uuid FK → auth.users)
├── recipe_id (uuid FK → recipes)
├── created_at (timestamptz)
└── UNIQUE (user_id, recipe_id)
```

Gate enforcement: Application-level check on insert. A trigger or RLS policy verifies `EXISTS (SELECT 1 FROM cook_log WHERE user_id = auth.uid() AND recipe_id = NEW.recipe_id)`.

### 4. Rating gate enforcement

**Decision:** Enforce "must have cooked" gate on `recipe_ratings` insert via RLS policy.

**Rationale:** Every rating on EefEats should mean someone actually cooked the dish. The RLS insert policy will check for at least one `cook_log` entry for the user+recipe pair. This is enforced at the database level — no way around it.

### 5. Migration strategy for `is_favorite`

**Decision:** Drop `is_favorite` column. All existing `is_favorite = true` recipes are already owned by the user (they're in the collection). No migration to `saved_recipes` needed (that's for other people's recipes). No migration to `recipe_favorites` (user confirmed these are "want to cook" not "love it").

**Migration steps:**
1. Add new tables (`cook_log`, `saved_recipes`, `recipe_favorites`)
2. Migrate existing `recipe_ratings` rows with `cooked_date` into `cook_log` (backfill)
3. Drop `is_favorite` column from `recipes`
4. Update application code to use new tables

### 6. Existing `recipe_ratings` data migration

**Decision:** Backfill `cook_log` from existing `recipe_ratings` rows that have a `cooked_date`. Keep `recipe_ratings` as-is — it still holds ratings. Don't delete any rating rows.

For each `recipe_ratings` row with `cooked_date IS NOT NULL`, insert into `cook_log` with `cooked_at = cooked_date`.

After migration, `recipe_ratings` retains its current schema but new inserts require a `cook_log` entry to exist first.

## Risks / Trade-offs

**[Breaking change: is_favorite removal]** → Mitigated by doing this at invite scale with 2 users. No third-party integrations depend on it. Web and mobile code updated in same change.

**[Cook log backfill accuracy]** → Existing `recipe_ratings` with `cooked_date` are a reasonable proxy. Some early ratings might not have `cooked_date` set — these won't get cook_log entries, which means those recipes can't be favorited until re-cooked. Acceptable at current scale.

**[RLS performance on gate checks]** → The `EXISTS` subquery in RLS policies adds a join on every rating insert and favorite insert. At current scale (2 users) this is negligible. At scale, the `(user_id, recipe_id)` index on `cook_log` keeps this fast.

**[UI complexity increase]** → Recipe detail now has more actions (save, cook, rate, favorite). Risk of cluttered UI. Mitigated by progressive disclosure: save is always visible, cook/rate/favorite appear contextually.

## Open Questions

None — scope is clear and small enough to proceed.
