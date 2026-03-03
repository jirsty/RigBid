import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware that checks the NextAuth session cookie.
 * Does NOT import the full auth config (which bundles Prisma, bcrypt, etc.)
 * to stay under Vercel's 1MB Edge Function size limit.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check for NextAuth session token cookie
  const token =
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value;

  // Protect /dashboard/* routes - must be authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Protect /admin/* routes - must be authenticated
  // (Role check is done server-side in the admin pages themselves)
  if (pathname.startsWith("/admin")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
