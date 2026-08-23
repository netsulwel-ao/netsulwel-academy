import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes require auth-uid cookie + admin role check via Firestore
  // We only verify the cookie exists here; role check is done server-side in each API route
  if (pathname.startsWith("/admin")) {
    const authUid = request.cookies.get("auth-uid")?.value;
    if (!authUid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect teacher routes
  if (pathname.startsWith("/dashboard/teacher")) {
    const authUid = request.cookies.get("auth-uid")?.value;
    if (!authUid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect institution dashboard routes
  if (pathname.startsWith("/dashboard/institution")) {
    const authUid = request.cookies.get("auth-uid")?.value;
    if (!authUid) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/teacher/:path*",
    "/dashboard/institution/:path*",
  ],
};
