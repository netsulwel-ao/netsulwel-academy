import { NextRequest } from "next/server";
import { AccessToken, TrackSource } from "livekit-server-sdk";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { roomName, name } = await req.json();

    if (!roomName || !name) {
      return Response.json(
        { error: "roomName e name são obrigatórios." },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json(
        { error: "LiveKit não configurado no servidor." },
        { status: 500 }
      );
    }

    // Verificar role do utilizador no Firestore Admin SDK
    // para determinar se é host (admin/teacher) sem confiar no cliente
    let isHost = false;
    try {
      const admin = getFirebaseAdmin();
      const userDoc = await admin.firestore().collection("users").doc(uid).get();
      if (userDoc.exists) {
        const role = userDoc.data()?.role;
        isHost = role === "admin" || role === "teacher";
      }
    } catch {
      // Se não conseguir verificar o role, nega privilégios de host
      isHost = false;
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: uid,   // sempre o UID verificado — nunca user-supplied
      name,
      ttl: "6h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      // Host (admin/teacher) publica tudo; aluno só microfone
      canPublishSources: isHost ? undefined : [TrackSource.MICROPHONE],
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return Response.json({ token, isHost });
  } catch (error) {
    console.error("Erro ao gerar token LiveKit:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
