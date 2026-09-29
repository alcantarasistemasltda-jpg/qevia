import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase keys are not configured yet, continue gracefully
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAppRoute = pathname.startsWith("/app");
  const isCompleteProfileRoute = pathname === "/completar-cadastro";

  // 1. Unauthenticated user trying to access /app/* -> redirect to /login
  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user flow on /app/* or /completar-cadastro
  if (user && (isAppRoute || isCompleteProfileRoute)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_profile_complete")
      .eq("id", user.id)
      .single();

    const isComplete = profile?.is_profile_complete === true;

    // Incomplete profile trying to access /app/* -> redirect to /completar-cadastro
    if (!isComplete && isAppRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/completar-cadastro";
      return NextResponse.redirect(url);
    }

    // Complete profile trying to access /completar-cadastro -> redirect to /app
    if (isComplete && isCompleteProfileRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
