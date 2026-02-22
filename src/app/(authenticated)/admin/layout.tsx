import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/recipes");

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 border-b border-border pb-4">
        <h1 className="text-[20px] font-normal text-ink">Admin</h1>
        <nav className="flex gap-1">
          <Link
            href="/admin"
            className="px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:bg-surface-alt hover:text-ink"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:bg-surface-alt hover:text-ink"
          >
            Users
          </Link>
          <Link
            href="/admin/invites"
            className="px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:bg-surface-alt hover:text-ink"
          >
            Invites
          </Link>
          <Link
            href="/admin/feedback"
            className="px-3 py-1.5 text-[11px] font-normal tracking-[0.02em] text-ink-secondary hover:bg-surface-alt hover:text-ink"
          >
            Feedback
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
