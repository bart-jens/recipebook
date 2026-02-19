import { createClient } from "@/lib/supabase/server";
import { ShoppingListView } from "./shopping-list-view";

export default async function ShoppingListPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get or create the user's shopping list
  let { data: list } = await supabase
    .from("shopping_lists")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!list) {
    const { data: newList } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id })
      .select("id, name")
      .single();
    list = newList;
  }

  if (!list) return null;

  const { data: items } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("shopping_list_id", list.id)
    .order("is_checked")
    .order("created_at");

  // Fetch recipe titles for attribution
  const recipeIds = Array.from(
    new Set((items || []).flatMap((item) => item.recipe_ids || []))
  );
  let recipeTitles: Record<string, string> = {};
  if (recipeIds.length > 0) {
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title")
      .in("id", recipeIds);
    recipeTitles = Object.fromEntries(
      (recipes || []).map((r) => [r.id, r.title])
    );
  }

  return (
    <ShoppingListView
      listId={list.id}
      initialItems={items || []}
      recipeTitles={recipeTitles}
    />
  );
}
