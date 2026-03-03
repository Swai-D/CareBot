// middleware.js — Place at root of Next.js project
// Protects /dashboard routes, redirects unauthenticated users

import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED = ["/dashboard"];
// Routes only for guests (redirect logged-in users away)
const GUEST_ONLY = ["/auth", "/"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value ||
                request.headers.get("authorization")?.replace("Bearer ", "");

  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isGuestOnly = GUEST_ONLY.includes(pathname);

  // Not logged in → redirect to /auth
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in + guest-only route → redirect to /dashboard
  if (isGuestOnly && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
