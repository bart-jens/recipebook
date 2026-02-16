-- Activity feed: unified view of social events + RPC for querying

-- View that UNIONs cook events, publish events, and fork events
CREATE OR REPLACE VIEW activity_feed_view AS

-- Cook events (from recipe_ratings)
SELECT
  'cooked'::text AS event_type,
  rr.user_id,
  rr.recipe_id,
  rr.created_at AS event_at,
  rr.notes
FROM recipe_ratings rr

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

-- Fork events (recipes with forked_from_id set)
SELECT
  'forked'::text AS event_type,
  r.created_by AS user_id,
  r.id AS recipe_id,
  r.created_at AS event_at,
  NULL::text AS notes
FROM recipes r
WHERE r.forked_from_id IS NOT NULL;

-- RPC function for querying the feed with cursor-based pagination
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
  -- Joined user profile fields
  display_name text,
  avatar_url text,
  -- Joined recipe fields
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_activity_feed(uuid, timestamptz, int) TO authenticated;
