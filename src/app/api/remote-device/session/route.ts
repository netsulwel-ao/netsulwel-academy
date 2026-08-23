import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const APP_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_CALLS_APP_ID!;
const APP_TOKEN = process.env.CLOUDFLARE_CALLS_API_TOKEN!;
const API_BASE = `https://rtc.live.cloudflare.com/v1/apps/${APP_ID}`;

function cfHeaders() {
  return {
    Authorization: `Bearer ${APP_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * POST /api/remote-device/session
 * Authenticated solely by the short-lived device token (no Firebase user auth needed).
 *
 * action = undefined → create session
 * action = "push"    → push tracks
 */
async function validateToken(db: FirebaseFirestore.Firestore, token: string) {
  const snap = await db.collectionGroup("remoteDevices")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const data = snap.docs[0].data();
  if (Date.now() > data.expiresAt) return null;
  return data;
}

export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !APP_TOKEN) {
      return NextResponse.json({ error: "Cloudflare Calls not configured." }, { status: 503 });
    }

    const body = await req.json();
    const { token, action, offer, tracks, sessionId } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const deviceData = await validateToken(db, token);

    if (!deviceData) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    // ── Create session ─────────────────────────────────────
    if (!action) {
      if (!offer) return NextResponse.json({ error: "Missing offer" }, { status: 400 });

      const res = await fetch(`${API_BASE}/sessions/new`, {
        method: "POST",
        headers: cfHeaders(),
        body: JSON.stringify({ sessionDescription: offer }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error: ${text}` }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({
        sessionId: data.sessionId,
        sessionDescription: data.sessionDescription,
      });
    }

    // ── Push tracks ────────────────────────────────────────
    if (action === "push") {
      if (!sessionId || !offer || !tracks) {
        return NextResponse.json({ error: "Missing sessionId, offer or tracks" }, { status: 400 });
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/tracks/new`, {
        method: "POST",
        headers: cfHeaders(),
        body: JSON.stringify({ sessionDescription: offer, tracks }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error: ${text}` }, { status: 502 });
      }
      const pushData = await res.json();
      return NextResponse.json(pushData);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("remote-device/session error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
