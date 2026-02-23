# Private Recipe UX — Design

**Date:** 2026-02-23
**Status:** Approved, ready for implementation planning

---

## Problem

Users are confused about why some recipes are private and why their cooking activity isn't visible to friends. The app silently enforces IP restrictions without explaining them. Three concrete pain points:

1. **Import → surprise.** Users import a recipe and don't understand it's permanently private until after saving. No explanation at import time.
2. **Cook activity invisible.** Users cook an imported recipe, but it doesn't appear in their public activity or feed. Their cook stat was also wrong (fixed in migration 048).
3. **Friend's private recipe.** When following a link to someone's private recipe, the message "In [name]'s private collection" gives no context about why or what to do next.

---

## Mental model to establish

EefEats has two layers:

- **Personal cookbook** — imported recipes, saved for your own use. Instructions stay private (IP reasons). This is like Instapaper: a reading list, not a publishing platform.
- **Your recipes** — original recipes you wrote or personal recipes shared with you. These are yours to publish, share, and build a following around.

The app currently never communicates this distinction. Every piece of copy in this design should reinforce it naturally, without legal language.

---

## Core design decisions

### 1. Cook activity is always visible — decoupled from recipe privacy

Cooking a recipe is a social act. Showing "Bart cooked Chicken Tikka Masala" is not an IP issue — you're sharing the act of cooking, not the instructions.

The activity feed and profile activity tab will show **all cook log entries**, regardless of recipe visibility. The entry adapts based on source:

| Recipe source | Activity entry |
|---|---|
| URL import | "[Name] cooked **Pasta Carbonara** · from Serious Eats →" (links to source URL) |
| Photo import — published source | "[Name] cooked **Chocolate Chip Cookies** · from a cookbook" |
| Photo import — personal recipe | "[Name] cooked **Grandma's Apple Cake**" (links to recipe normally) |
| Manual / fork | "[Name] cooked **My Lamb Tagine**" (links to recipe normally) |

For private recipe entries (URL import, cookbook), the link goes to the **original source**, not the private recipe page. This gives attribution to the original creator and avoids a dead end for the viewer.

### 2. Photo import gets a source declaration step

Photo imports are the hardest case because there's no URL — the recipe could be from a published book or a handwritten family recipe. One question during the import flow disambiguates this:

> **Where is this recipe from?**
> - "A cookbook, magazine, or published website" → saved as private, cookbook rules apply
> - "A personal recipe — family, friend, handwritten" → treated as your own content, can publish

The user self-declares. If they misrepresent it, the responsibility is theirs (standard platform practice). This single choice determines:
- Whether the Publish option is available
- What label appears on the recipe ("from a cookbook" vs none)
- How the activity feed entry reads

This adds a new value to the recipes table: `is_personal boolean default false`. The DB CHECK constraint that prevents photo imports from going public is updated to allow `source_type = 'photo' AND is_personal = true`.

### 3. Friendly, plain-language copy throughout

No "IP rights", no legal language. Copy should feel like a knowledgeable friend explaining it:

**Import chooser page** (before choosing URL or Photo):
> "Recipes you import from cookbooks and websites are saved to your personal cookbook — only you can see them. Recipes you create yourself can be published and shared with your followers."

**URL import — after extraction, before saving:**
> "This will be saved to your personal cookbook. The full recipe stays private, but your cooking activity will still show in your feed."

**Photo import — source declaration step:**
> "Who shared this recipe with you?"
> - "It's from a book, magazine, or website" → private
> - "It's a personal recipe — family, friend, or my own" → yours to publish

**Recipe detail — private URL/cookbook import:**
> "From your personal cookbook · [Source name →]"
> "The full recipe is private, but your followers will see when you cook it."

**Recipe detail — private photo/cookbook import (no source):**
> "From your personal cookbook · saved from a cookbook"
> "Your followers will see when you cook it."

**Recipe detail — private personal photo import:**
> Same as manual: publish banner with "Your followers can't see this yet. Publish it to share with them."

**Profile activity tab — for private recipe cook entries:**
Show the entry with source attribution (or "from a cookbook"), but no link to the private recipe page.

**When viewing someone else's private recipe card:**
> "In [Name]'s personal cookbook · from [Source →]"
> "This recipe is saved privately. [View original →] or [Save to my cookbook]"

---

## What changes

### Database
- Add `is_personal boolean default false not null` to `recipes` table
- Update the CHECK constraint: photo imports can be public only when `is_personal = true`
- Migration required

### Activity feed view (`activity_feed_view`)
- Remove `AND r.visibility = 'public'` filter from cook_log join
- Add source columns to output: `r.source_url`, `r.source_name`, `r.source_type`, `r.is_personal`
- Frontend uses these to render the right entry format

### `get_chef_profile` RPC — activity tab
- Same change: remove visibility filter from activity query
- Add source columns so frontend can render attribution

### Photo import flow (web + mobile)
- After AI extraction, before the edit form: show source declaration step
- Selected value sets `is_personal` on save

### Import chooser page (web + mobile)
- Add a short paragraph below the heading explaining the private/public split

### Recipe detail — private recipe banner (web + mobile)
- Update copy on the "imported recipe" banner to be warmer and more informative
- For URL imports: show source name and note that cook activity is still visible
- For cookbook imports: same, but "from a cookbook"
- For personal photo imports: same publish banner as manual recipes

### Profile activity tab (web + mobile)
- Show all cook entries
- For private recipe entries: render with source attribution, no link to recipe page

---

## Out of scope

- "Write your own version" / fork flow — useful but not the primary answer here
- AI-assisted instruction rewriting — deferred, legally grey
- Granular per-recipe activity privacy controls — adds complexity without enough user value

---

## Copy reference

All user-facing copy, for use during implementation:

| Location | Copy |
|---|---|
| Import chooser — subheading | "Recipes you import stay in your personal cookbook. Only recipes you create can be published." |
| URL import — before save | "Saved to your personal cookbook. Your cooking activity will still appear in your feed." |
| Photo import — source question | "Where is this recipe from?" |
| Photo import — option A | "A cookbook, magazine, or website" |
| Photo import — option B | "A personal recipe — family, friend, or my own creation" |
| Recipe detail — URL import banner | "From your personal cookbook · [source →] · Your followers see when you cook it." |
| Recipe detail — cookbook import banner | "From your personal cookbook · saved from a cookbook · Your followers see when you cook it." |
| Recipe detail — personal photo (unpublished) | "Your followers can't see this yet. Publish it to share with them." |
| Activity feed — URL import cook | "[Name] cooked [Title] · from [Source →]" |
| Activity feed — cookbook cook | "[Name] cooked [Title] · from a cookbook" |
| Other user's private recipe | "In [Name]'s personal cookbook · [View original →] · [Save to my cookbook]" |
| Profile activity tab — private recipe entry | "[Title] · from [Source →]" or "[Title] · from a cookbook" |
