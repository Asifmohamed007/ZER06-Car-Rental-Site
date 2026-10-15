import { NextResponse, type NextRequest } from "next/server";

/**
 * First line of defence only: bounces visitors without a session cookie away from /admin.
 * The real check (session validated in the database) runs in every admin page and server action via requireAdmin().
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !req.cookies.get("z6_admin")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
