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
      <div className="mb-6 flex items-center gap-4 border-b border-warm-border pb-4">
        <h1 className="text-lg font-semibold">Admin</h1>
        <nav className="flex gap-1">
          <Link
            href="/admin"
            className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag hover:text-[#111111]"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag hover:text-[#111111]"
          >
            Users
          </Link>
          <Link
            href="/admin/invites"
            className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag hover:text-[#111111]"
          >
            Invites
          </Link>
          <Link
            href="/admin/feedback"
            className="rounded-md px-3 py-1.5 text-sm text-warm-gray hover:bg-warm-tag hover:text-[#111111]"
          >
            Feedback
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
