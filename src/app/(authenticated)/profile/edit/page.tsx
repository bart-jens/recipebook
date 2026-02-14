import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

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
      <h1 className="mb-6 font-serif text-2xl font-semibold">Edit Profile</h1>
      <ProfileForm
        profile={{
          display_name: profile?.display_name || "",
          bio: profile?.bio || "",
        }}
      />
    </div>
  );
}
