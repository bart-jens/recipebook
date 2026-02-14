import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, visibility, updated_at")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false });

  const { data: ratings } = await supabase
    .from("recipe_ratings")
    .select("id")
    .eq("user_id", user.id);

  const publicCount = (recipes || []).filter((r) => r.visibility === "public").length;
  const totalRecipes = (recipes || []).length;
  const timesCooked = (ratings || []).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/recipes" className="text-sm text-warm-gray hover:text-accent">
          &larr; Back to recipes
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-tag text-2xl font-serif font-semibold text-warm-gray">
            {(profile?.display_name || "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold">
              {profile?.display_name || "Anonymous"}
            </h1>
            <p className="text-sm text-warm-gray">{user.email}</p>
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-md border border-warm-border px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag"
        >
          Edit profile
        </Link>
      </div>

      {profile?.bio && (
        <p className="mb-6 text-warm-gray leading-relaxed">{profile.bio}</p>
      )}

      <div className="mb-8 flex gap-6">
        <div className="text-center">
          <p className="text-xl font-semibold">{totalRecipes}</p>
          <p className="text-xs text-warm-gray">recipes</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{publicCount}</p>
          <p className="text-xs text-warm-gray">published</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{timesCooked}</p>
          <p className="text-xs text-warm-gray">times cooked</p>
        </div>
      </div>

      {(recipes || []).length > 0 && (
        <div>
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="font-serif text-xs font-medium uppercase tracking-widest text-warm-gray">
              Your Recipes
            </h2>
          </div>
          <div className="space-y-2">
            {(recipes || []).slice(0, 10).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="flex items-center justify-between rounded-md border border-warm-border bg-white px-4 py-3 transition-shadow hover:shadow-md"
              >
                <span className="font-serif font-medium">{recipe.title}</span>
                <span className="text-xs text-warm-gray">
                  {recipe.visibility === "public" ? "Public" : "Private"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
