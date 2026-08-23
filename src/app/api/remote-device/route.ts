import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const EXPIRES_MS = 10 * 60 * 1000; // 10 minutes

/**
 * POST /api/remote-device
 * Body: { action: "create", liveId }
 * Creates a short-lived token that allows a mobile device to join
 * as a remote camera/mic source without requiring a user login.
 *
 * POST /api/remote-device
 * Body: { action: "validate", token }
 * Validates the token and returns liveId + remaining TTL.
 *
 * DELETE /api/remote-device?liveId=xxx&token=yyy
 * Revokes the token (host disconnects the device).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // ── CREATE ────────────────────────────────────────────
    if (action === "create") {
      // Must be authenticated
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
      }
      const idToken = authHeader.slice(7);
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(idToken);
      } catch {
        return NextResponse.json({ error: "Token inválido." }, { status: 401 });
      }

      const { liveId } = body;
      if (!liveId) {
        return NextResponse.json({ error: "Missing liveId" }, { status: 400 });
      }

      // Verify caller owns the live
      const liveSnap = await db.doc(`lives/${liveId}`).get();
      if (!liveSnap.exists) {
        return NextResponse.json({ error: "Live não encontrada." }, { status: 404 });
      }
      const liveData = liveSnap.data()!;
      const userSnap = await db.doc(`users/${decoded.uid}`).get();
      const role = userSnap.data()?.role ?? "aluno";
      const isOwner = liveData.createdBy === decoded.uid;
      const isAdmin = role === "admin";
      const isTeacher = role === "teacher";

      if (!isOwner && !isAdmin && !isTeacher) {
        return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
      }

      // Generate cryptographically random token
      const tokenBytes = new Uint8Array(24);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const expiresAt = Date.now() + EXPIRES_MS;

      await db.doc(`lives/${liveId}/remoteDevices/${token}`).set({
        token,
        liveId,
        createdBy: decoded.uid,
        createdAt: new Date().toISOString(),
        expiresAt,
        status: "pending", // pending | connected | disconnected
      });

      return NextResponse.json({ token, expiresAt });
    }

    // ── VALIDATE ──────────────────────────────────────────
    if (action === "validate") {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
      }

      // Search across all lives for this token
      const snap = await db.collectionGroup("remoteDevices")
        .where("token", "==", token)
        .limit(1)
        .get();

      if (snap.empty) {
        return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 404 });
      }

      const data = snap.docs[0].data();

      if (Date.now() > data.expiresAt) {
        return NextResponse.json({ error: "Token expirado." }, { status: 410 });
      }

      // Mark as connected
      await snap.docs[0].ref.update({ status: "connected" });

      return NextResponse.json({
        liveId: data.liveId,
        expiresAt: data.expiresAt,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("remote-device error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const idToken = authHeader.slice(7);
    const admin = getFirebaseAdmin();
    await admin.auth().verifyIdToken(idToken);
    const db = admin.firestore();

    const { searchParams } = new URL(req.url);
    const liveId = searchParams.get("liveId");
    const token = searchParams.get("token");

    if (!liveId || !token) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await db.doc(`lives/${liveId}/remoteDevices/${token}`).delete();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
