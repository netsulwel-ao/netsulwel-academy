import { NextRequest } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
  try {
    const { roomName, identity, name, isHost } = await req.json();

    if (!roomName || !identity || !name) {
      return Response.json(
        { error: "roomName, identity e name são obrigatórios." },
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

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: "6h",
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: !!isHost,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return Response.json({ token });
  } catch (error) {
    console.error("Erro ao gerar token LiveKit:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
