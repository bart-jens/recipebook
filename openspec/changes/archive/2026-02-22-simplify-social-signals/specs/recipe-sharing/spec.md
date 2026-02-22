## REMOVED Requirements

### Requirement: Recipe shares table
**Reason**: The recommendation system is being removed entirely. Cook logs with ratings serve as natural recommendations, making the explicit "recommend" action redundant.
**Migration**: Drop `recipe_shares` table. No user content is lost — the table only stored metadata references (user_id, recipe_id, notes). Users' actual recipes remain in the recipes table.

### Requirement: Recipe share cards view
**Reason**: The view existed to expose non-copyrightable metadata for recommendation cards. With recommendations removed, the view has no consumers.
**Migration**: Drop `recipe_share_cards` view before dropping `recipe_shares` table (view depends on table).

### Requirement: RLS on recipe shares
**Reason**: Table is being dropped.
**Migration**: RLS policies are dropped with the table.

### Requirement: Share flow for imported recipes
**Reason**: The "Recommend" toggle on imported recipe detail pages is removed. Cook logs are the social signal.
**Migration**: Remove `RecommendedBadge` component and `addRecommendation`/`removeRecommendation` server actions.

### Requirement: Recommendation card display
**Reason**: Recommendation cards in the feed and on profile pages are removed. Cook events with inline ratings replace this.
**Migration**: Remove `RecommendationCard` component (web + mobile). Remove "Recs" tab from profile pages. Remove `recommendations` key from `get_chef_profile` RPC.

### Requirement: Save to my recipes
**Reason**: The "Save to my recipes" flow from recommendation cards is removed along with the cards. Users discover recipes through cook events in the feed, which link to recipe detail pages where the existing `SaveButton` works.
**Migration**: Remove `saveRecommendation` server action. The existing `saveRecipe`/`unsaveRecipe` actions on `saved_recipes` table remain and handle the save use case.

### Requirement: Free vs premium photo limits
**Reason**: This requirement was incorrectly scoped under recipe-sharing. It belongs in recipe-images. No behavioral change — just removing from this spec since the spec is being archived.
**Migration**: Requirement should be captured in recipe-images spec if not already present.
