import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";
import { AvatarUpload } from "./avatar-upload";

export default async function EditProfilePage() {
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

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-3xl text-ink">Edit Profile</h1>
      <div className="mb-6">
        <AvatarUpload
          userId={user.id}
          currentUrl={profile?.avatar_url || null}
          displayName={profile?.display_name || "?"}
        />
      </div>
      <ProfileForm
        profile={{
          display_name: profile?.display_name || "",
          bio: profile?.bio || "",
          is_private: profile?.is_private ?? false,
        }}
      />
    </div>
  );
}
