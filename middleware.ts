import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Determine base response first — rewrite for admin subdomain, passthrough otherwise
  const adminDomain = process.env.ADMIN_DOMAIN || "admin.professionalbusines.com";
  // effectivePathname is what the app actually renders — used for x-pathname so the
  // root layout knows to drop the public chrome on the admin subdomain root.
  let effectivePathname = pathname;
  let response: NextResponse;
  if (
    (hostname === adminDomain || hostname.includes("admin-pro")) &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    effectivePathname = url.pathname;
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next({ request });
  }

  // Refresh Supabase session — cookies are written to the single response above
  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  response.headers.set("x-pathname", effectivePathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
