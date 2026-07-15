import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/egress/stop
 * Stop recording a LiveKit room
 * 
 * Body:
 * {
 *   liveId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId } = await req.json();

    if (!liveId) {
      return Response.json(
        { error: "liveId é obrigatório." },
        { status: 400 }
      );
    }

    // Verify user is teacher/admin for this live session
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();
    
    if (!liveDoc.exists) {
      return Response.json({ error: "Live session não encontrada." }, { status: 404 });
    }

    const liveData = liveDoc.data();
    if (liveData?.createdBy !== uid) {
      return Response.json({ error: "Não tem permissão para parar a gravação." }, { status: 403 });
    }

    if (!liveData?.egressId || liveData?.recordingStatus !== "recording") {
      return Response.json({
        error: "Nenhuma gravação ativa para parar.",
        recordingStatus: liveData?.recordingStatus,
      }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return Response.json(
        { error: "LiveKit não configurado no servidor." },
        { status: 500 }
      );
    }

    const egressId = liveData.egressId;

    // Stop the egress
    const stopResponse = await fetch(
      `${livekitUrl}/twirp/livekit.Egress/StopEgress`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${generateEgressToken(apiKey, apiSecret)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          egressId,
        }),
      }
    );

    if (!stopResponse.ok) {
      const errorData = await stopResponse.json();
      console.error("LiveKit Egress stop error:", errorData);
      // Even if stop fails, update status to processing since file may be finalizing
    }

    // Update Firestore status to processing (file is being finalized and uploaded)
    await admin.firestore().collection("lives").doc(liveId).update({
      recordingStatus: "processing",
      recordingStoppedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      recordingStatus: "processing",
      message: "Gravação parada. Processando ficheiro...",
    });
  } catch (error) {
    console.error("Erro ao parar gravação:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

function generateEgressToken(apiKey: string, apiSecret: string): string {
  const { SignerJWT } = require("jose");
  const secret = Buffer.from(apiSecret);

  const token = new SignerJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .setIssuer(apiKey)
    .setSubject(apiKey);

  return token.sign(secret);
}
