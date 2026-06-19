import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const uid = request.cookies.get("auth-uid")?.value;
  const hasValidUid = uid && uid.length > 10;

  const isProtected = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/register/") || pathname === "/verify-email" || pathname === "/";
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

  if (isStatic) return NextResponse.next();
  if (isPublicPage && hasValidUid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isProtected && !hasValidUid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)"],
};
