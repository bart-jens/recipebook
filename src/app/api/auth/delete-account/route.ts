import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Delete user's avatar files
  const { data: avatarFiles } = await admin.storage
    .from("avatars")
    .list(user.id);
  if (avatarFiles?.length) {
    await admin.storage
      .from("avatars")
      .remove(avatarFiles.map((f) => `${user.id}/${f.name}`));
  }

  // Delete user's recipe images (nested: {user_id}/{recipe_id}/{file})
  const { data: recipeFolders } = await admin.storage
    .from("recipe-images")
    .list(user.id);
  if (recipeFolders?.length) {
    const allPaths: string[] = [];
    for (const folder of recipeFolders) {
      const { data: files } = await admin.storage
        .from("recipe-images")
        .list(`${user.id}/${folder.name}`);
      if (files?.length) {
        allPaths.push(
          ...files.map((f) => `${user.id}/${folder.name}/${f.name}`)
        );
      }
    }
    if (allPaths.length) {
      await admin.storage.from("recipe-images").remove(allPaths);
    }
  }

  // Delete auth user — cascades to all user data via foreign keys
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
