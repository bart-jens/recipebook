"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function resetPassword(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: "Something went wrong. Please try again." };
  redirect("/home");
}
