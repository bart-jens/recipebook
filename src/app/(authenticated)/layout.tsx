import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/logo";

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
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen">
      <header className="border-b border-warm-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/home" className="inline-flex">
              <Logo height={22} />
            </Link>
            <nav className="flex items-center gap-1">
              <Link href="/home" className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:text-[#111111]">
                Home
              </Link>
              <Link href="/recipes" className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:text-[#111111]">
                My Recipes
              </Link>
              <Link href="/discover" className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:text-[#111111]">
                Discover
              </Link>
              <Link href="/invites" className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:text-[#111111]">
                Invites
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-warm-gray hover:text-[#111111]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-warm-tag text-xs font-semibold text-[#111111]">
                {displayName[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline">{displayName}</span>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:text-[#111111]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
      <footer className="border-t border-warm-divider px-6 py-6">
        <div className="mx-auto max-w-3xl text-center text-xs text-warm-gray/40">
          EefEats &mdash; made with love
        </div>
      </footer>
    </div>
  );
}
