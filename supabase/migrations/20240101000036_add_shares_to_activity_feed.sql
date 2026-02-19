-- Add shared events to activity feed
--
-- Problem: recipe_shares are stored correctly but never appear in the
-- activity_feed_view. Users don't see recommendations from people they follow
-- in their feed, even though the data exists in the recipe_shares table.
--
-- Fix: Add a third UNION branch for shared events. Filter to public recipes
-- for consistency with cook/publish events (shares of private recipes should
-- not leak through the SECURITY DEFINER RPC).

CREATE OR REPLACE VIEW activity_feed_view AS

-- Cook events (from cook_log, only for public recipes)
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes
FROM cook_log cl
JOIN recipes r ON r.id = cl.recipe_id
WHERE r.visibility = 'public'

UNION ALL

-- Publish events (recipes with published_at set and public visibility)
SELECT
  'published'::text AS event_type,
  r.created_by AS user_id,
  r.id AS recipe_id,
  r.published_at AS event_at,
  NULL::text AS notes
FROM recipes r
WHERE r.visibility = 'public'
  AND r.published_at IS NOT NULL

UNION ALL

-- Share events (recommendations from recipe_shares, only for public recipes)
SELECT
  'shared'::text AS event_type,
  rs.user_id,
  rs.recipe_id,
  rs.shared_at AS event_at,
  rs.notes
FROM recipe_shares rs
JOIN recipes r ON r.id = rs.recipe_id
WHERE r.visibility = 'public';
