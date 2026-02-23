-- Grant execute permission on get_recipe_card to authenticated users.
-- Without this, supabase.rpc('get_recipe_card', ...) returns null silently
-- because Supabase revokes default PUBLIC execute privileges.
GRANT EXECUTE ON FUNCTION get_recipe_card(uuid) TO authenticated;
