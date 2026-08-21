import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidUid(v?: string): boolean {
  return typeof v === "string" && v.length >= 28 && v.length <= 128;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const uid = request.cookies.get("auth-uid")?.value;
  const hasValidUid = isValidUid(uid);

  const isProtected =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/verify-email";

  const isAccessLink = pathname.startsWith("/access/");

  if (isAccessLink) return NextResponse.next();

  if (isAuthPage && hasValidUid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected && !hasValidUid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
