import { NextRequest, NextResponse } from "next/server";
import { JWT_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  const isAuthenticated = !!token && verifyAdminToken(token) !== null;

  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const isLoginPage = pathname === "/admin/login";

    if (isLoginPage) {
      if (isAuthenticated) {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url),
        );
      }
      return NextResponse.next();
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
  // jsonwebtoken uses Node's crypto module (require calls) which the
  // default Edge runtime does not support. Without this, jwt.verify()
  // throws inside verifyAdminToken -> isAuthenticated is always false ->
  // every request to /admin/dashboard bounces back to /admin/login, and
  // the underlying "crypto module not supported" error surfaces
  // intermittently depending on caching.
  runtime: "nodejs",
};