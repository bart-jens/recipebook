import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface RecentRecipe {
  id: string;
  title: string;
  image_url: string | null;
  updated_at: string;
}

interface TrendingRecipe {
  id: string;
  title: string;
  image_url: string | null;
  created_by: string;
}

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { count: recipeCount },
    { count: favoriteCount },
    { count: cookedCount },
    { data: recent },
    { data: trending },
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id),
    supabase
      .from("recipes")
      .select("*", { count: "exact", head: true })
      .eq("created_by", user.id)
      .eq("is_favorite", true),
    supabase
      .from("recipe_ratings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("recipes")
      .select("id, title, image_url, updated_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("recipes")
      .select("id, title, image_url, created_by")
      .eq("visibility", "public")
      .order("published_at", { ascending: false })
      .limit(6),
  ]);

  const displayName = profile?.display_name || "Chef";

  // Get creator names for trending recipes
  const creatorIds = Array.from(
    new Set((trending || []).map((r) => r.created_by))
  );
  const { data: profiles } =
    creatorIds.length > 0
      ? await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", creatorIds)
      : { data: [] };
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p.display_name])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold">
        {greeting()}, {displayName}
      </h1>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Link
          href="/recipes"
          className="rounded-md border border-warm-border bg-white p-4 text-center transition-shadow hover:shadow-md"
        >
          <p className="text-2xl font-bold text-accent">{recipeCount || 0}</p>
          <p className="mt-1 text-xs text-warm-gray">recipes</p>
        </Link>
        <div className="rounded-md border border-warm-border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-accent">{favoriteCount || 0}</p>
          <p className="mt-1 text-xs text-warm-gray">favorites</p>
        </div>
        <div className="rounded-md border border-warm-border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-accent">{cookedCount || 0}</p>
          <p className="mt-1 text-xs text-warm-gray">times cooked</p>
        </div>
      </div>

      {/* Recently Updated */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold">
            Recently Updated
          </h2>
          <Link
            href="/recipes"
            className="text-sm text-warm-gray hover:text-accent"
          >
            See all
          </Link>
        </div>
        {(recent || []).length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-warm-border p-8 text-center">
            <p className="text-warm-gray">No recipes yet.</p>
            <Link
              href="/recipes/new"
              className="mt-2 inline-block text-sm font-medium text-accent hover:underline"
            >
              Create your first recipe
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(recent as RecentRecipe[]).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group overflow-hidden rounded-md border border-warm-border bg-white transition-shadow hover:shadow-md"
              >
                {recipe.image_url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-warm-tag">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-accent to-[#E8A87C]">
                    <span className="text-sm font-medium text-white/80">
                      {recipe.title.slice(0, 1)}
                    </span>
                  </div>
                )}
                <div className="p-3">
                  <p className="line-clamp-1 font-serif text-sm font-medium">
                    {recipe.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Discover / Trending */}
      {(trending || []).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold">Discover</h2>
            <Link
              href="/discover"
              className="text-sm text-warm-gray hover:text-accent"
            >
              Browse
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(trending as TrendingRecipe[]).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="group overflow-hidden rounded-md border border-warm-border bg-white transition-shadow hover:shadow-md"
              >
                {recipe.image_url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-warm-tag">
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-accent to-[#E8A87C]">
                    <span className="text-sm font-medium text-white/80">
                      {recipe.title.slice(0, 1)}
                    </span>
                  </div>
                )}
                <div className="p-3">
                  <p className="line-clamp-1 font-serif text-sm font-medium">
                    {recipe.title}
                  </p>
                  <p className="mt-0.5 text-xs text-warm-gray">
                    by {profileMap.get(recipe.created_by) || "Unknown"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
