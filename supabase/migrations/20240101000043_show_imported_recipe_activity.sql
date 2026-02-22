-- ============================================
-- Show Imported Recipe Activity
--
-- The activity feed was filtering to visibility = 'public' on all events,
-- which hid cook/favorite events for imported recipes (always private).
-- Fix: remove visibility filter from cooked/favorited events so friends
-- can see what others cook and favorite, while keeping "created" (published)
-- events public-only.
--
-- Also adds recipe visibility to the RPC output so the frontend can
-- decide whether to link internally (public) or to source_url (private).
-- ============================================

-- ------------------------------------------
-- 1. Replace activity_feed_view
-- ------------------------------------------
DROP VIEW IF EXISTS public.activity_feed_view;

CREATE OR REPLACE VIEW activity_feed_view AS

-- Created events: only manual public recipes (publishing)
SELECT
  'created'::text AS event_type,
  r.created_by AS user_id,
  r.id AS recipe_id,
  r.published_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipes r
WHERE r.visibility = 'public'
  AND r.published_at IS NOT NULL
  AND r.source_type = 'manual'

UNION ALL

-- Cook events: ALL recipes (not just public)
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes,
  rr.rating
FROM cook_log cl
JOIN recipes r ON r.id = cl.recipe_id
LEFT JOIN recipe_ratings rr ON rr.recipe_id = cl.recipe_id AND rr.user_id = cl.user_id

UNION ALL

-- Favorited events: ALL recipes (not just public)
SELECT
  'favorited'::text AS event_type,
  rf.user_id,
  rf.recipe_id,
  rf.created_at AS event_at,
  NULL::text AS notes,
  NULL::integer AS rating
FROM recipe_favorites rf
JOIN recipes r ON r.id = rf.recipe_id;

-- ------------------------------------------
-- 2. Replace get_activity_feed RPC
-- ------------------------------------------
-- Add recipe_visibility to output so frontend knows how to link
DROP FUNCTION IF EXISTS get_activity_feed(uuid, timestamptz, int);
CREATE OR REPLACE FUNCTION get_activity_feed(
  p_user_id uuid,
  p_before timestamptz DEFAULT now(),
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  event_type text,
  user_id uuid,
  recipe_id uuid,
  event_at timestamptz,
  notes text,
  display_name text,
  avatar_url text,
  recipe_title text,
  recipe_image_url text,
  source_url text,
  source_name text,
  rating integer,
  recipe_visibility text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    af.event_type,
    af.user_id,
    af.recipe_id,
    af.event_at,
    af.notes,
    up.display_name,
    up.avatar_url,
    r.title AS recipe_title,
    r.image_url AS recipe_image_url,
    r.source_url,
    r.source_name,
    af.rating,
    r.visibility::text AS recipe_visibility
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;
