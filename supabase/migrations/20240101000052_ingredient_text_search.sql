-- GIN index for full-text search on ingredient names
CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredient_name_fts_idx
  ON recipe_ingredients
  USING GIN (to_tsvector('english', ingredient_name));

-- search_recipes_by_ingredient
-- Returns recipe IDs accessible to auth.uid() (owned or saved) whose ingredients match.
-- SECURITY DEFINER: runs with definer privileges; access is explicitly scoped to auth.uid().
CREATE OR REPLACE FUNCTION search_recipes_by_ingredient(query text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT r.id
  FROM recipes r
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE to_tsvector('english', ri.ingredient_name) @@ plainto_tsquery('english', query)
    AND (
      r.created_by = auth.uid()
      OR r.id IN (
        SELECT recipe_id FROM saved_recipes WHERE user_id = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION search_recipes_by_ingredient(text) TO authenticated;

-- search_public_recipes_by_ingredient
-- Returns public recipe IDs whose ingredients match. No auth scoping needed.
CREATE OR REPLACE FUNCTION search_public_recipes_by_ingredient(query text)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT r.id
  FROM recipes r
  JOIN recipe_ingredients ri ON ri.recipe_id = r.id
  WHERE r.visibility = 'public'
    AND to_tsvector('english', ri.ingredient_name) @@ plainto_tsquery('english', query);
$$;

-- Discover page requires authentication; anon grant omitted intentionally.
GRANT EXECUTE ON FUNCTION search_public_recipes_by_ingredient(text) TO authenticated;
