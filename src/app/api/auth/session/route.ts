import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

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

      // Verify the Firebase ID token to ensure the caller owns this UID
      const authHeader = request.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Token de autenticação não fornecido." }, { status: 401 });
      }

      const token = authHeader.slice(7);
      try {
        const admin = getFirebaseAdmin();
        const decoded = await admin.auth().verifyIdToken(token);
        if (decoded.uid !== uid) {
          return NextResponse.json({ error: "UID não corresponde ao token." }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
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
