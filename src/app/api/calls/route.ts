import { NextRequest, NextResponse } from "next/server";
import { verifyLiveAccess } from "@/lib/verify-live-access";
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
 * POST /api/calls — Authenticated proxy for Cloudflare Calls API
 * Every action requires: Authorization header + valid liveId in body
 */
export async function POST(req: NextRequest) {
  try {
    if (!APP_ID || !APP_TOKEN || APP_ID === "YOUR_APP_ID") {
      return NextResponse.json(
        { error: "Cloudflare Calls not configured." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { action, liveId } = body;

    if (!liveId) {
      return NextResponse.json({ error: "Missing liveId" }, { status: 400 });
    }

    // ─── AUTH: verify token + live access ─────────────────
    let access;
    try {
      access = await verifyLiveAccess(req, liveId);
    } catch (err: any) {
      // verifyLiveAccess throws NextResponse on failure
      return err;
    }

    const { uid, isOwner, isAdmin, isTeacher } = access;

    // ─── createSession ───────────────────────────────────
    if (action === "createSession") {
      const { offer } = body;
      if (!offer) {
        return NextResponse.json({ error: "Missing offer SDP" }, { status: 400 });
      }
      const res = await fetch(`${API_BASE}/sessions/new`, {
        method: "POST",
        headers: cfHeaders(),
        body: JSON.stringify({ sessionDescription: offer }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error (${res.status}): ${text}` }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({
        sessionId: data.sessionId,
        sessionDescription: data.sessionDescription,
      });
    }

    // ─── pushTracks (HOST + approved SPEAKERS) ────────────
    if (action === "pushTracks") {
      const admin = getFirebaseAdmin();

      // A speaker is approved when the host creates the handraise approval doc.
      // That doc may not exist yet at push time (race condition), so also check
      // the handraises collection as a fallback — anyone the host approved is allowed.
      const isSpeakerDoc = await admin.firestore().doc(`lives/${liveId}/speakers/${uid}`).get();
      const isApprovedSpeaker = isSpeakerDoc.exists;

      // Also accept if the user was previously approved (doc may have been written
      // without sessionId yet — we allow the push and they'll update it right after).
      const liveDoc = await admin.firestore().doc(`lives/${liveId}`).get();
      const isLiveOwner = liveDoc.data()?.createdBy === uid || liveDoc.data()?.teacherId === uid;

      if (!isOwner && !isAdmin && !isTeacher && !isApprovedSpeaker && !isLiveOwner) {
        return NextResponse.json({ error: "Apenas o professor ou oradores aprovados podem publicar tracks." }, { status: 403 });
      }

      const { sessionId, offer, tracks } = body;
      if (!sessionId || !offer || !tracks) {
        return NextResponse.json({ error: "Missing sessionId, offer, or tracks" }, { status: 400 });
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/tracks/new`, {
        method: "POST",
        headers: cfHeaders(),
        body: JSON.stringify({ sessionDescription: offer, tracks }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error (${res.status}): ${text}` }, { status: 502 });
      }
      const pushData = await res.json();

      // Only write hostSessionId + publishedTracks when HOST pushes (not speakers)
      if (!isApprovedSpeaker) {
        const trackNames = tracks.map((t: any) => t.trackName);
        await admin.firestore().doc(`lives/${liveId}`).update({
          hostSessionId: sessionId,
          publishedTracks: trackNames,
          status: "live",
          startedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json(pushData);
    }

    // ─── pullTracks (VIEWER) ─────────────────────────────
    if (action === "pullTracks") {
      const { sessionId, tracks } = body;
      if (!sessionId || !tracks) {
        return NextResponse.json({ error: "Missing sessionId or tracks" }, { status: 400 });
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/tracks/new`, {
        method: "POST",
        headers: cfHeaders(),
        body: JSON.stringify({ tracks }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error (${res.status}): ${text}` }, { status: 502 });
      }
      const pullData = await res.json();
      return NextResponse.json(pullData);
    }

    // ─── renegotiate ─────────────────────────────────────
    if (action === "renegotiate") {
      const { sessionId, answer } = body;
      if (!sessionId || !answer) {
        return NextResponse.json({ error: "Missing sessionId or answer" }, { status: 400 });
      }
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/renegotiate`, {
        method: "PUT",
        headers: cfHeaders(),
        body: JSON.stringify({ sessionDescription: answer }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `Cloudflare error (${res.status}): ${text}` }, { status: 502 });
      }
      const renegData = await res.json();
      return NextResponse.json(renegData);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Calls API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
