import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CollectionRecipeList } from "./collection-recipe-list";

export default async function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, description")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!collection) notFound();

  const { data: memberships } = await supabase
    .from("collection_recipes")
    .select("recipe_id, added_at, recipes(id, title, description, image_url, prep_time_minutes, cook_time_minutes)")
    .eq("collection_id", collection.id)
    .order("added_at", { ascending: false });

  interface MembershipRow {
    recipe_id: string;
    added_at: string;
    recipes: {
      id: string;
      title: string;
      description: string | null;
      image_url: string | null;
      prep_time_minutes: number | null;
      cook_time_minutes: number | null;
    } | null;
  }

  const recipes = ((memberships || []) as MembershipRow[])
    .filter((m) => m.recipes)
    .map((m) => ({
      id: m.recipes!.id,
      title: m.recipes!.title,
      description: m.recipes!.description,
      image_url: m.recipes!.image_url,
      prep_time_minutes: m.recipes!.prep_time_minutes,
      cook_time_minutes: m.recipes!.cook_time_minutes,
    }));

  return (
    <div className="px-5 py-4 pb-24">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{collection.name}</h1>
        {collection.description && (
          <p className="mt-1 text-sm text-warm-gray">{collection.description}</p>
        )}
        <p className="mt-1 text-xs text-warm-gray">
          {recipes.length} recipe{recipes.length !== 1 ? "s" : ""}
        </p>
      </div>

      <CollectionRecipeList
        collectionId={collection.id}
        initialRecipes={recipes}
      />
    </div>
  );
}
