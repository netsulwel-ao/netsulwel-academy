import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/signaling — Authenticated session management
 * Body: { action: "register" | "deleteSession", liveId, sessionId, role? }
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    const db = admin.firestore();

    const body = await req.json();
    const { action, liveId, sessionId, role } = body;

    if (!liveId || !sessionId) {
      return NextResponse.json({ error: "Missing liveId or sessionId" }, { status: 400 });
    }

    if (action === "register") {
      // Remove any stale sessions for this user in this live (handles page refresh)
      const existingSnap = await db
        .collection("lives")
        .doc(liveId)
        .collection("sessions")
        .where("uid", "==", decoded.uid)
        .get();
      const batch = db.batch();
      existingSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      await db.collection("lives").doc(liveId).collection("sessions").doc(sessionId).set({
        sessionId,
        uid: decoded.uid,
        role,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Signaling error:", err);
    if (err.code === "auth/id-token-expired" || err.code === "auth/id-token-revoked") {
      return NextResponse.json({ error: "Token expirado." }, { status: 401 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/signaling — Remove session (authenticated)
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const admin = getFirebaseAdmin();
    await admin.auth().verifyIdToken(token);
    const db = admin.firestore();

    const { searchParams } = new URL(req.url);
    const liveId = searchParams.get("liveId");
    const sessionId = searchParams.get("sessionId");

    if (!liveId || !sessionId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await db
      .collection("lives")
      .doc(liveId)
      .collection("sessions")
      .doc(sessionId)
      .delete();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
