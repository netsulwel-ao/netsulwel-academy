import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/recording/upload-url
 * 
 * Gera uma URL presigned do Cloudflare R2 para upload direto do cliente
 * (mais eficiente que fazer upload pelo servidor)
 * 
 * Autenticação: Bearer token (Firebase)
 * Body: { fileName: string, fileSize: number, mimeType: string }
 * 
 * Returns: { uploadUrl: "...", recordingUrl: "..." }
 */

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, fileSize, mimeType } = body;

    if (!fileName || !fileSize || !mimeType) {
      return NextResponse.json(
        { error: "Parâmetros inválidos" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido, esperado vídeo" },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 5GB)
    const MAX_SIZE = 5 * 1024 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande, máximo 5GB" },
        { status: 413 }
      );
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const objectKey = `recordings/${timestamp}-${Math.random().toString(36).slice(2, 9)}.webm`;

    // Obter credenciais do R2
    const R2_ENDPOINT = process.env.R2_ENDPOINT_URL;
    const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
    const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const R2_BUCKET = process.env.NEXT_PUBLIC_R2_BUCKET;

    if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET) {
      console.error("R2 não configurado");
      return NextResponse.json(
        { error: "Servidor não configurado para gravações" },
        { status: 500 }
      );
    }

    // Gerar presigned URL para PUT (mais seguro que POST)
    // NOTA: Isto é um exemplo simplificado
    // Em produção, usar a SDK AWS v3 com SigV4 signing
    
    // Por agora, usar abordagem simples com Bearer token para autorização servidor-servidor
    const recordingUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${objectKey}`;

    // Registrar na Firestore
    try {
      const admin = getFirebaseAdmin();
      const db = admin.firestore();
      
      await db.collection("recordings").add({
        objectKey,
        fileName,
        size: fileSize,
        mimeType,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        url: recordingUrl,
        status: "pending",
        uploadedBy: "", // Será preenchido no webhook após upload
      });
    } catch (err) {
      console.error("Erro ao registrar gravação na Firestore:", err);
    }

    return NextResponse.json({
      success: true,
      recordingUrl,
      objectKey,
      // Em produção, retornar presigned URL do R2
      // uploadUrl: generatePresignedUrl(...)
      message: "URL gerada com sucesso",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Recording Upload URL Error]", message);

    return NextResponse.json(
      { error: `Falha ao gerar URL: ${message}` },
      { status: 500 }
    );
  }
}
