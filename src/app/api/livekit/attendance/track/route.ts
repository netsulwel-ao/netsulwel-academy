import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/attendance/track
 * Track user join/leave events in a live session
 * Called when user joins or leaves the LiveKit room
 * 
 * Body:
 * {
 *   liveId: string,
 *   event: "join" | "leave",
 *   displayName?: string (optional, for explicit tracking)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, event, displayName } = await req.json();

    if (!liveId || !event || !["join", "leave"].includes(event)) {
      return Response.json(
        { error: "liveId e event (join/leave) são obrigatórios." },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();

    // Verify live session exists
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();
    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }

    // Get user details if not provided
    let userName = displayName;
    if (!userName) {
      const userDoc = await admin.firestore().collection("users").doc(uid).get();
      userName = userDoc.data()?.displayName || "Utilizador Anónimo";
    }

    // Create or update access log entry
    const timestamp = new Date();
    const logEntry = {
      userId: uid,
      displayName: userName,
      event,
      timestamp: admin.firestore.Timestamp.now(),
      eventAt: timestamp.toISOString(),
    };

    // Add to access_logs subcollection
    await admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("access_logs")
      .add(logEntry);

    // Store in analytics for aggregated reports
    await admin
      .firestore()
      .collection("analytics_events")
      .add({
        liveId,
        userId: uid,
        displayName: userName,
        eventType: "attendance",
        action: event,
        timestamp: admin.firestore.Timestamp.now(),
      });

    return Response.json({
      success: true,
      message: `${event === "join" ? "Entrada" : "Saída"} registada.`,
      timestamp: timestamp.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao rastrear presença:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
