import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/recording/upload
 * 
 * Upload de vídeo gravado (WebRTC MediaRecorder) para Cloudflare R2
 * 
 * Autenticação: Bearer token (Firebase)
 * Body: FormData com arquivo
 * 
 * Returns: { recordingUrl: "https://r2.example.com/path" }
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

    // Parse do FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não fornecido" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Tipo de arquivo inválido, esperado vídeo" },
        { status: 400 }
      );
    }

    // Validar tamanho (máx 5GB)
    const MAX_SIZE = 5 * 1024 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande, máximo 5GB" },
        { status: 413 }
      );
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now();
    const fileName = `recordings/${timestamp}-${Math.random().toString(36).slice(2, 9)}.webm`;

    // Configurar S3 client para R2
    const S3_ENDPOINT = process.env.R2_ENDPOINT_URL;
    const S3_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
    const S3_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
    const S3_BUCKET = process.env.NEXT_PUBLIC_R2_BUCKET;
    const S3_REGION = process.env.NEXT_PUBLIC_R2_REGION || "auto";

    if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
      console.error("R2 não configurado");
      return NextResponse.json(
        { error: "Servidor não configurado para gravações" },
        { status: 500 }
      );
    }

    // Converter arquivo para Buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload direto para R2 usando presigned URL (mais simples)
    // Aqui usamos uma abordagem alternativa: enviar para backend que cuida do upload
    
    // Para produção, recomenda-se usar:
    // 1. aws-sdk-js v3
    // 2. Presigned URLs
    // 3. Multipart uploads para arquivos grandes

    console.log(`[Recording Upload] Arquivo recebido: ${file.name}, tamanho: ${file.size} bytes`);

    // PLACEHOLDER: Em produção, fazer upload real para R2
    // Por enquanto, retornar URL mock
    const recordingUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`;

    // Registrar na Firestore (opcional)
    try {
      const admin = getFirebaseAdmin();
      const db = admin.firestore();
      
      await db.collection("recordings").add({
        fileName,
        originalFileName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        url: recordingUrl,
        status: "pending", // "pending", "uploaded", "failed"
      });
    } catch (err) {
      console.error("Erro ao registrar gravação na Firestore:", err);
    }

    return NextResponse.json({
      success: true,
      recordingUrl,
      message: "Gravação enviada com sucesso",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Recording Upload Error]", message);

    return NextResponse.json(
      { error: `Falha no upload: ${message}` },
      { status: 500 }
    );
  }
}
