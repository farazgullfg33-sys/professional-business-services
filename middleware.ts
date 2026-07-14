import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({ request });

  // Refresh Supabase session cookie on every request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token — must be called before any supabase.auth.getUser()
  await supabase.auth.getUser();

  // admin-pro.aiinvention.tech → rewrite to /admin
  if (hostname.includes("admin-pro")) {
    const url = request.nextUrl.clone();
    if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      response = NextResponse.rewrite(url);
    }
  }

  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
