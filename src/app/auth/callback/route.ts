import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // Ignored when called in Route Handler if middleware handles cookies.
            }
          },
        },
      }
    );

    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && authData?.user) {
      // Check if profile is complete
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_profile_complete")
        .eq("id", authData.user.id)
        .single();

      if (profile?.is_profile_complete) {
        return NextResponse.redirect(`${origin}/app`);
      } else {
        return NextResponse.redirect(`${origin}/completar-cadastro`);
      }
    }
  }

  // If code is missing or exchange failed, redirect back to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=oauth_error`);
}
