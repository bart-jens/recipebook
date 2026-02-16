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

  const { data: followers } = await supabase
    .from("user_follows")
    .select("id")
    .eq("following_id", user.id);

  const { data: following } = await supabase
    .from("user_follows")
    .select("id")
    .eq("follower_id", user.id);

  // Count pending follow requests (only for private profiles)
  let pendingRequestCount = 0;
  if (profile?.is_private) {
    const { count } = await supabase
      .from("follow_requests")
      .select("id", { count: "exact", head: true })
      .eq("target_id", user.id);
    pendingRequestCount = count || 0;
  }

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
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warm-tag text-2xl font-semibold text-warm-gray">
              {(profile?.display_name || "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {profile?.display_name || "Anonymous"}
            </h1>
            <p className="text-sm text-warm-gray">{user.email}</p>
            {profile?.is_private && (
              <span className="text-xs text-warm-gray">Private account</span>
            )}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-md bg-warm-tag px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-border"
        >
          Edit profile
        </Link>
      </div>

      {profile?.bio && (
        <p className="mb-6 text-warm-gray leading-relaxed">{profile.bio}</p>
      )}

      {pendingRequestCount > 0 && (
        <Link
          href="/profile/requests"
          className="mb-6 flex items-center justify-between rounded-md border border-accent/20 bg-accent/5 p-3"
        >
          <span className="text-sm font-medium">Follow requests</span>
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 text-xs font-medium text-white">
            {pendingRequestCount}
          </span>
        </Link>
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
        <div className="text-center">
          <p className="text-xl font-semibold">{(followers || []).length}</p>
          <p className="text-xs text-warm-gray">followers</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">{(following || []).length}</p>
          <p className="text-xs text-warm-gray">following</p>
        </div>
      </div>

      {(recipes || []).length > 0 && (
        <div>
          <div className="mb-4 border-b border-warm-divider pb-2">
            <h2 className="text-xs font-medium uppercase tracking-widest text-warm-gray">
              Your Recipes
            </h2>
          </div>
          <div className="space-y-2">
            {(recipes || []).slice(0, 10).map((recipe) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="flex items-center justify-between rounded-md bg-warm-tag px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
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
