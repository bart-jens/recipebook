-- Remove fork functionality and update activity feed
-- Keeps forked_from_id column and source_type='fork' for existing data safety

-- 1. Drop the fork_recipe RPC function
drop function if exists public.fork_recipe(uuid);

-- 2. Replace activity_feed_view without fork events (cooked + published only)
CREATE OR REPLACE VIEW activity_feed_view AS

-- Cook events (from cook_log)
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes
FROM cook_log cl

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

-- 3. Replace get_activity_feed function (same signature, reads from updated view)
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
  recipe_image_url text
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
    r.image_url AS recipe_image_url
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;
