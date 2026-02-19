"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleItemChecked(itemId: string) {
  const supabase = createClient();
  const { data: item } = await supabase
    .from("shopping_list_items")
    .select("is_checked")
    .eq("id", itemId)
    .single();
  if (!item) return;

  await supabase
    .from("shopping_list_items")
    .update({ is_checked: !item.is_checked })
    .eq("id", itemId);

  revalidatePath("/shopping-list");
}

export async function addManualItem(listId: string, ingredientName: string) {
  const supabase = createClient();
  const { data: item, error } = await supabase
    .from("shopping_list_items")
    .insert({
      shopping_list_id: listId,
      ingredient_name: ingredientName,
    })
    .select("id, ingredient_name, quantity, unit, is_checked, recipe_ids")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/shopping-list");
  return { item };
}

export async function deleteItem(itemId: string) {
  const supabase = createClient();
  await supabase.from("shopping_list_items").delete().eq("id", itemId);
  revalidatePath("/shopping-list");
}

export async function clearCheckedItems(listId: string) {
  const supabase = createClient();
  await supabase.rpc("clear_checked_items", {
    p_shopping_list_id: listId,
  });
  revalidatePath("/shopping-list");
}

export async function clearAllItems(listId: string) {
  const supabase = createClient();
  await supabase
    .from("shopping_list_items")
    .delete()
    .eq("shopping_list_id", listId);
  revalidatePath("/shopping-list");
}

export async function updateItemQuantity(
  itemId: string,
  quantity: number | null
) {
  const supabase = createClient();
  await supabase
    .from("shopping_list_items")
    .update({ quantity })
    .eq("id", itemId);
  revalidatePath("/shopping-list");
}

export async function addRecipeToShoppingList(listId: string, recipeId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_recipe_to_shopping_list", {
    p_shopping_list_id: listId,
    p_recipe_id: recipeId,
  });
  if (error) return { error: error.message };
  revalidatePath("/shopping-list");
}

export async function addRecipeToDefaultShoppingList(recipeId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get or create the default shopping list
  let { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!list) {
    const { data: newList, error: createError } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (createError) return { error: createError.message };
    list = newList;
  }

  if (!list) return { error: "Failed to create shopping list" };

  return addRecipeToShoppingList(list.id, recipeId);
}
