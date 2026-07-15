import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/egress/start
 * Start recording a LiveKit room using Egress API
 * 
 * Body:
 * {
 *   roomName: string,
 *   liveId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { roomName, liveId } = await req.json();

    if (!roomName || !liveId) {
      return Response.json(
        { error: "roomName e liveId são obrigatórios." },
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
      return Response.json({ error: "Não tem permissão para gravar esta sessão." }, { status: 403 });
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

    // Check if already recording
    if (liveData?.recordingStatus === "recording" && liveData?.egressId) {
      return Response.json({
        error: "A sessão já está a ser gravada.",
        recordingStatus: "recording",
        egressId: liveData.egressId,
      }, { status: 409 });
    }

    // Use LiveKit Egress API to start recording
    // See: https://docs.livekit.io/reference/server-apis/#egress
    const egressResponse = await fetch(`${livekitUrl}/twirp/livekit.Egress/StartRoomCompositeEgress`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${generateEgressToken(apiKey, apiSecret)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName,
        // Record both video and audio to MP4 file in R2 bucket
        file: {
          filepath: `recordings/${liveId}/${Date.now()}.mp4`,
          s3: {
            accessKey: process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID,
            secret: process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY,
            bucket: process.env.S3_BUCKET || process.env.R2_BUCKET_NAME,
            region: process.env.S3_REGION || "",
            endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT,
            tagsJson: JSON.stringify({
              liveId,
              timestamp: new Date().toISOString(),
            }),
          },
        },
        layout: "speaker",
        audioCodec: "AAC",
        videoCodec: "H264",
      }),
    });

    if (!egressResponse.ok) {
      const errorData = await egressResponse.json();
      console.error("LiveKit Egress API error:", errorData);
      return Response.json(
        { error: "Erro ao iniciar gravação.", details: errorData },
        { status: 500 }
      );
    }

    const egressData = await egressResponse.json();
    const egressId = egressData.egressId;

    // Update Firestore with recording metadata
    await admin.firestore().collection("lives").doc(liveId).update({
      recordingStatus: "recording",
      egressId,
      recordingStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      recordingStatus: "recording",
      egressId,
      message: "Gravação iniciada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao iniciar gravação:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// Helper to generate JWT token for LiveKit Egress API
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
