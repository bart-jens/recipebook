import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthNav } from "./components/auth-nav";

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
  const initial = displayName[0].toUpperCase();
  const followerBadge = newFollowerCount && newFollowerCount > 0
    ? newFollowerCount > 9 ? "9+" : String(newFollowerCount)
    : null;

  return (
    <div className="min-h-screen">
      <AuthNav initial={initial} followerBadge={followerBadge} />
      <hr className="rule-thick border-0" />
      <main className="max-w-[480px] mx-auto">{children}</main>
      <footer className="max-w-[480px] mx-auto px-5 py-8">
        <hr className="rule-thin border-0 mb-4" />
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
          EefEats
        </p>
      </footer>
    </div>
  );
}
