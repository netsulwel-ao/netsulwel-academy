import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const uid = request.cookies.get("auth-uid")?.value;

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/login" || pathname === "/register" || pathname === "/";
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isStatic) return NextResponse.next();
  if (isPublicPage && uid) {
    // Already logged in — redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isProtected && !uid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)"],
};
