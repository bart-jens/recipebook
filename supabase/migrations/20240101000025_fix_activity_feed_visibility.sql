-- Fix activity feed: add visibility filter to cook events
--
-- Problem: cook events in activity_feed_view have no visibility filter.
-- Since get_activity_feed is SECURITY DEFINER, it bypasses RLS and returns
-- cook events for private recipes. This causes:
-- 1. 404 when clicking a private recipe from the feed (detail page uses RLS)
-- 2. Misleading timestamps (private cook events appear but can't be viewed)
--
-- Fix: JOIN recipes and filter to public visibility on cook events,
-- matching the publish events which already have this filter.

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
  AND r.published_at IS NOT NULL;
