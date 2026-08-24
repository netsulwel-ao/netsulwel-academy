import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }

  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const snap = await db
      .collection("emailVerifications")
      .where("token", "==", token)
      .where("used", "==", false)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.redirect(
        new URL("/verify-email?error=invalid_token", req.url),
      );
    }

    const doc = snap.docs[0];
    const data = doc.data();
    const expiresAt = data.expiresAt?.toMillis?.() ?? 0;

    if (Date.now() > expiresAt) {
      return NextResponse.redirect(
        new URL("/verify-email?error=expired", req.url),
      );
    }

    await doc.ref.update({ used: true });

    try {
      const user = await admin.auth().getUserByEmail(data.email);
      if (!user.emailVerified) {
        await admin.auth().updateUser(user.uid, { emailVerified: true });
      }
    } catch (fbErr) {
      console.error("[verify-email] Failed to mark user as verified:", fbErr);
    }

    return NextResponse.redirect(
      new URL("/verify-email?success=true", req.url),
    );
  } catch (err) {
    console.error("[verify-email] Error:", err);
    return NextResponse.redirect(
      new URL("/verify-email?error=server_error", req.url),
    );
  }
}
