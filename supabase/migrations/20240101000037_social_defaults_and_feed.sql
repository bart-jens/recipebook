-- ============================================
-- Social Defaults & Feed Rewrite
--
-- 1. Change default visibility to 'public' (manual recipes go public by default)
-- 2. Auto-set published_at on insert/update when visibility is 'public'
-- 3. Drop enforce_publish_limit trigger (removing free-tier publish cap for now)
-- 4. Rewrite activity_feed_view with 4 event types: created, saved, cooked, rated
-- 5. Rewrite get_activity_feed RPC with source_url, source_name, rating columns
--
-- NOTE: The recipes_publish_rules CHECK constraint still protects imported
-- recipes — they will fail to insert with visibility='public', so app code must
-- explicitly set visibility='private' for imports. That is handled in app code,
-- not in this migration.
-- ============================================

-- ------------------------------------------
-- 1. Change default visibility to 'public'
-- ------------------------------------------
-- Manual and fork recipes should default to public (social-first).
-- Imported recipes are protected by the recipes_publish_rules CHECK constraint.
ALTER TABLE public.recipes ALTER COLUMN visibility SET DEFAULT 'public';

-- ------------------------------------------
-- 2. Auto-set published_at on insert/update when visibility is 'public'
-- ------------------------------------------
-- When a recipe is created or toggled to public visibility, we need published_at
-- to be set so it appears in the activity feed with a correct timestamp.
CREATE OR REPLACE FUNCTION public.auto_set_published_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.visibility = 'public' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_published_at_trigger ON public.recipes;
CREATE TRIGGER auto_set_published_at_trigger
  BEFORE INSERT OR UPDATE OF visibility ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_published_at();

-- ------------------------------------------
-- 3. Drop enforce_publish_limit trigger and function
-- ------------------------------------------
-- Removing the free-tier publish cap. With public-by-default, a per-recipe
-- publish limit doesn't make sense. Monetization will use different levers.
DROP TRIGGER IF EXISTS enforce_publish_limit_trigger ON public.recipes;
DROP FUNCTION IF EXISTS public.enforce_publish_limit();

-- ------------------------------------------
-- 4. Rewrite activity_feed_view with 4 event types
-- ------------------------------------------
-- Event types:
--   created  — manual recipes that are public (was "published")
--   saved    — recipe_shares (was "shared"); no visibility filter because
--              imported recipes are private but share cards only expose
--              non-copyrightable metadata (title, source, image)
--   cooked   — from cook_log, public recipes only
--   rated    — from recipe_ratings, public recipes only (NEW)
--
-- Added rating column (NULL for non-rated events).
CREATE OR REPLACE VIEW activity_feed_view AS

-- Created events: manual recipes that are public
-- (forks cannot be public per recipes_publish_rules CHECK constraint)
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

-- Saved events: recipe_shares (auto-recommendations)
-- No visibility filter: imported recipes are private but share cards
-- only expose non-copyrightable metadata (title, source, image)
SELECT
  'saved'::text AS event_type,
  rs.user_id,
  rs.recipe_id,
  rs.shared_at AS event_at,
  rs.notes,
  NULL::integer AS rating
FROM recipe_shares rs

UNION ALL

-- Cook events: from cook_log, only for public recipes
SELECT
  'cooked'::text AS event_type,
  cl.user_id,
  cl.recipe_id,
  cl.cooked_at AS event_at,
  cl.notes,
  NULL::integer AS rating
FROM cook_log cl
JOIN recipes r ON r.id = cl.recipe_id
WHERE r.visibility = 'public'

UNION ALL

-- Rated events: from recipe_ratings, only for public recipes
SELECT
  'rated'::text AS event_type,
  rr.user_id,
  rr.recipe_id,
  rr.created_at AS event_at,
  rr.notes,
  rr.rating
FROM recipe_ratings rr
JOIN recipes r ON r.id = rr.recipe_id
WHERE r.visibility = 'public';

-- ------------------------------------------
-- 5. Rewrite get_activity_feed RPC
-- ------------------------------------------
-- Added source_url, source_name, and rating to the return type so the
-- frontend can render richer feed cards (e.g., "saved a recipe from NYT Cooking").
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
  rating integer
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
    af.rating
  FROM activity_feed_view af
  JOIN user_follows uf ON uf.following_id = af.user_id AND uf.follower_id = p_user_id
  JOIN user_profiles up ON up.id = af.user_id
  JOIN recipes r ON r.id = af.recipe_id
  WHERE af.event_at < p_before
  ORDER BY af.event_at DESC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION get_activity_feed(uuid, timestamptz, int) TO authenticated;

-- ------------------------------------------
-- 6. Indexes for feed query performance
-- ------------------------------------------
CREATE INDEX IF NOT EXISTS cook_log_cooked_at_idx ON public.cook_log(cooked_at DESC);
CREATE INDEX IF NOT EXISTS recipe_ratings_created_at_idx ON public.recipe_ratings(created_at DESC);
