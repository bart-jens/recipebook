import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/recipes";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Detect new OAuth users by checking if their identity was just created.
        // The handle_new_user trigger creates a profile immediately, so !profile is
        // always false — instead we check if this is a first-time sign-in.
        const identity = user.identities?.[0];
        const isNewUser = identity &&
          new Date(identity.created_at).getTime() > Date.now() - 120_000;

        if (isNewUser) {
          return NextResponse.redirect(`${origin}/signup/verify-invite?provider=true`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // OAuth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
