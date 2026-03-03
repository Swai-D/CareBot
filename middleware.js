// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Acha API routes zipite bila kizuizi cha middleware kwa sasa (kwa urahisi wa majaribio)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  // Kama ni dashboard na hakuna token, rudi auth
  if (pathname.startsWith("/dashboard") && !token) {
    // Hapa nimezima redirect kwa sasa ili tuone kama Dashboard inafunguka
    // return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
