import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/recipes";

  if (code) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Detect new OAuth users by checking if their identity was just created.
          // The handle_new_user trigger creates a profile immediately, so !profile is
          // always false — instead we check if this is a first-time sign-in.
          const identity = user.identities?.[0];
          const isNewUser = identity?.created_at &&
            new Date(identity.created_at).getTime() > Date.now() - 120_000;

          if (isNewUser) {
            const cookieStore = cookies();
            const rawInviteCode = cookieStore.get("oauth_invite_code")?.value;
            const inviteCode = rawInviteCode ? decodeURIComponent(rawInviteCode) : null;
            const verifyUrl = new URL(`${origin}/signup/verify-invite`);
            verifyUrl.searchParams.set("provider", "true");
            if (inviteCode) verifyUrl.searchParams.set("code", inviteCode);
            return NextResponse.redirect(verifyUrl.toString());
          }
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error("[auth/callback] unexpected error:", err);
    }
  }

  // OAuth error or exception — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
