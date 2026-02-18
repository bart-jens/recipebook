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
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to EefEats</h1>
          <p className="mt-2 text-sm text-warm-gray">
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
