import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, avatar_url, onboarded_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded_at) redirect("/recipes");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-3xl text-ink">Welcome to EefEats</h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-muted">
            Set up your profile to get started
          </p>
        </div>
        <OnboardingForm
          userId={user.id}
          initialDisplayName={profile?.display_name || ""}
          initialAvatarUrl={profile?.avatar_url || null}
        />
      </div>
    </div>
  );
}
