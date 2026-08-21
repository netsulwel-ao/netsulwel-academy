import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isValidUid(v?: string): boolean {
  return typeof v === "string" && v.length >= 28 && v.length <= 128;
}

export async function POST(request: NextRequest) {
  try {
    const { uid, action } = await request.json();

    if (action === "set") {
      if (!isValidUid(uid)) {
        return NextResponse.json({ error: "Invalid UID" }, { status: 400 });
      }
      const response = NextResponse.json({ success: true });
      response.cookies.set("auth-uid", uid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 86400,
      });
      return response;
    }

    if (action === "clear") {
      const response = NextResponse.json({ success: true });
      response.cookies.set("auth-uid", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
