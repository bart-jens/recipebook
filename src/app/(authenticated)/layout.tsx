import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { Logo, ForkDot } from "@/components/logo";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role, onboarded_at")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) {
    redirect("/onboarding");
  }

  const { data: newFollowerCount } = await supabase
    .rpc("get_new_follower_count", { p_user_id: user.id });

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const followerBadge = newFollowerCount && newFollowerCount > 0
    ? newFollowerCount > 9 ? "9+" : String(newFollowerCount)
    : null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-warm-border bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <Link href="/home" className="inline-flex shrink-0">
              <Logo height={22} />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-warm-gray hover:text-[#111111]"
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-warm-tag text-xs font-semibold text-[#111111]">
                  {displayName[0].toUpperCase()}
                  {followerBadge && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                      {followerBadge}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{displayName}</span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md px-2 py-1.5 text-sm text-warm-gray hover:text-[#111111]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto">
            <Link href="/home" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-warm-gray hover:text-[#111111]">
              Home
            </Link>
            <Link href="/recipes" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-warm-gray hover:text-[#111111]">
              My Recipes
            </Link>
            <Link href="/discover" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-warm-gray hover:text-[#111111]">
              Discover
            </Link>
            <Link href="/shopping-list" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-warm-gray hover:text-[#111111]">
              Grocery List
            </Link>
            <Link href="/invites" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm text-warm-gray hover:text-[#111111]">
              Invites
            </Link>
            {profile?.role === "admin" && (
              <Link href="/admin" className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-accent hover:text-accent">
                Admin
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-warm-divider px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 text-xs text-warm-gray/40">
          <span>EefEats</span>
          <ForkDot size={10} color="rgba(45,95,93,0.25)" />
          <span>made with love</span>
        </div>
      </footer>
    </div>
  );
}
