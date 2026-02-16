# Recipe Sharing

Recommendation cards for imported recipes — share flow, social card display, "save to my recipes", user photos with carousel, source attribution.

---

## Requirements

### Requirement: Recipe shares table
The database SHALL have a `recipe_shares` table with columns: `id` (uuid, PK, default gen_random_uuid()), `user_id` (uuid, NOT NULL, FK to auth.users on delete cascade), `recipe_id` (uuid, NOT NULL, FK to recipes on delete cascade), `notes` (text, nullable — user's description of changes they made), `shared_at` (timestamptz, NOT NULL, default now()). There SHALL be a unique constraint on (user_id, recipe_id). Only imported recipes (source_type != 'manual') SHALL be shareable via this table.

#### Scenario: Sharing an imported recipe
- **WHEN** user A shares their imported recipe with notes "Added extra garlic"
- **THEN** a row SHALL be created in recipe_shares with user_id = A, recipe_id = recipe, notes = "Added extra garlic"

#### Scenario: Cannot share a manual recipe via recipe_shares
- **WHEN** user A attempts to insert into recipe_shares for a recipe with source_type = 'manual'
- **THEN** the insert SHALL be rejected (manual recipes use the visibility/publish flow instead)

#### Scenario: Duplicate share prevented
- **WHEN** user A shares the same recipe twice
- **THEN** the second insert SHALL be rejected by the unique constraint

#### Scenario: Unsharing a recipe
- **WHEN** user A unshares a previously shared recipe
- **THEN** the recipe_shares row SHALL be deleted
- **AND** the recipe content SHALL remain in the user's private collection

### Requirement: Recipe share cards view
The database SHALL have a `recipe_share_cards` view that joins `recipe_shares` with safe (non-copyrightable) recipe metadata. The view SHALL expose: share id, user_id, recipe_id, share notes, shared_at, recipe title, source_url, source_name, source_type, image_url, and tags (from recipe_tags). The view SHALL NOT expose: instructions, description, or ingredient details.

#### Scenario: Card contains only safe metadata
- **WHEN** a follower queries recipe_share_cards for user A
- **THEN** the results SHALL include title, source_url, source_name, source_type, image_url, tags, share notes, and shared_at
- **AND** the results SHALL NOT include instructions, description, or full ingredient data

#### Scenario: Card includes user's rating
- **WHEN** user A has shared a recipe and also rated it
- **THEN** the card SHALL include user A's rating from recipe_ratings

### Requirement: RLS on recipe shares
RLS SHALL be enabled on `recipe_shares`. The sharer and their followers SHALL be able to read shares. Only the sharer SHALL be able to insert and delete their own shares.

#### Scenario: Follower can see shares
- **WHEN** user B follows user A, and user A has shared a recipe
- **THEN** user B SHALL be able to read user A's recipe_shares rows

#### Scenario: Non-follower cannot see shares
- **WHEN** user C does not follow user A
- **THEN** user C SHALL NOT be able to read user A's recipe_shares rows

#### Scenario: Owner can see own shares
- **WHEN** user A has shared recipes
- **THEN** user A SHALL be able to read their own recipe_shares rows

#### Scenario: Only owner can insert shares
- **WHEN** user B attempts to insert a share for user A's recipe
- **THEN** the insert SHALL be rejected unless user_id = auth.uid() and recipe belongs to auth.uid()

#### Scenario: Only owner can delete shares
- **WHEN** user B attempts to delete user A's share
- **THEN** the delete SHALL be rejected by RLS

### Requirement: Share flow for imported recipes
The system SHALL provide a share action on imported recipe detail pages. When tapped, the system SHALL prompt the user for optional notes about changes they made. The prompt SHALL use encouraging copy like "Any changes you made?" to invite the user to add personal commentary. After confirmation, the share SHALL be created.

#### Scenario: Sharing with notes
- **WHEN** user taps "Share" on an imported recipe and enters "Doubled the chili oil"
- **THEN** a recipe_shares row SHALL be created with notes = "Doubled the chili oil"

#### Scenario: Sharing without notes
- **WHEN** user taps "Share" on an imported recipe and leaves notes empty
- **THEN** a recipe_shares row SHALL be created with notes = null

#### Scenario: Share button only on imported recipes
- **WHEN** user views a recipe with source_type = 'manual'
- **THEN** the share action SHALL NOT be shown (use publish flow instead)

#### Scenario: Already shared recipe shows unshare option
- **WHEN** user views an imported recipe they have already shared
- **THEN** the UI SHALL show an option to unshare or edit share notes

### Requirement: Recommendation card display
The system SHALL display shared imported recipes as recommendation cards in the social feed and on user profile pages. Each card SHALL show: recipe title, source attribution ("via seriouseats.com"), user's rating (stars), user's notes about changes, and a thumbnail image (user photo preferred, source thumbnail fallback). Each card SHALL have actions: "View source" (opens source_url in browser) and "Save to my recipes".

#### Scenario: Card with source URL
- **WHEN** a recommendation card is displayed for a recipe with source_url = "https://www.seriouseats.com/miso-ramen"
- **THEN** the card SHALL show "via seriouseats.com" and "View source" SHALL link to the full URL

#### Scenario: Card without source URL
- **WHEN** a recommendation card is displayed for a recipe imported from a photo with source_name = "The Food Lab"
- **THEN** the card SHALL show "from The Food Lab" and "View source" SHALL NOT be shown

#### Scenario: Card with user notes
- **WHEN** a recommendation card has notes = "Used fresh noodles instead of dried"
- **THEN** the notes SHALL be displayed on the card below the rating

#### Scenario: Card without notes
- **WHEN** a recommendation card has null notes
- **THEN** the card SHALL display without a notes section (no empty space)

### Requirement: Save to my recipes
The system SHALL allow users to save a recipe from a recommendation card to their own collection. The save flow SHALL depend on the source type and URL availability.

#### Scenario: Save recipe with live source URL
- **WHEN** user taps "Save to my recipes" on a card with a reachable source_url
- **THEN** the system SHALL trigger the standard URL import flow with the source_url pre-filled
- **AND** the user SHALL review the extracted data before saving

#### Scenario: Save recipe with dead source URL
- **WHEN** user taps "Save to my recipes" on a card with an unreachable source_url
- **THEN** the system SHALL create a recipe with title and source attribution copied
- **AND** ingredients SHALL be copied from the original recipe
- **AND** instructions SHALL NOT be copied (user sees a message: "Original source is no longer available. We saved the title and ingredients — you may need to find the instructions elsewhere.")

#### Scenario: Save recipe with no source URL
- **WHEN** user taps "Save to my recipes" on a card from a photo/book import
- **THEN** the system SHALL create a recipe with title, source_name, and tags copied
- **AND** instructions and ingredients SHALL NOT be copied
- **AND** user sees: "This recipe is from [source_name]. We saved the title so you can look it up."

### Requirement: Free vs premium photo limits
Free users SHALL be able to upload up to 3 photos per recipe. Premium users SHALL be able to upload up to 10 photos per recipe. The limit SHALL be enforced at the API level.

#### Scenario: Free user at photo limit
- **WHEN** a free user with 3 photos on a recipe tries to upload a 4th
- **THEN** the upload SHALL be rejected with message "Free accounts can upload up to 3 photos per recipe. Upgrade to premium for up to 10."

#### Scenario: Premium user uploads freely
- **WHEN** a premium user uploads a 7th photo on a recipe
- **THEN** the upload SHALL succeed
