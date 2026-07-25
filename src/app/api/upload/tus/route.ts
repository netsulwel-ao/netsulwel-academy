import { NextRequest, NextResponse } from "next/server";
import { S3Client, CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { verifyAuth } from "@/lib/api-auth";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const PART_SIZE = 100 * 1024 * 1024; // 100MB per part

export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { filename, contentType, folder = "videos", fileSize } = await req.json();

    if (!filename || !contentType || !fileSize) {
      return NextResponse.json({ error: "filename, contentType e fileSize são obrigatórios." }, { status: 400 });
    }

    const ALLOWED_FOLDERS = new Set(["videos", "uploads"]);
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json({ error: "Pasta de upload inválida." }, { status: 400 });
    }

    const ext = filename.split(".").pop();
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const result = await s3.send(command);
    const uploadId = result.UploadId!;

    const totalParts = Math.ceil(fileSize / PART_SIZE);

    // Store upload metadata in a simple in-memory map (for production, use Redis/DB)
    const uploadMeta = {
      uploadId,
      key,
      bucket: process.env.R2_BUCKET_NAME!,
      totalParts,
      partSize: PART_SIZE,
      fileSize,
      parts: [] as { partNumber: number; ETag: string }[],
      createdBy: uid,
      createdAt: Date.now(),
    };

    // Use global This to persist across requests in dev
    const g = globalThis as typeof globalThis & { __tusUploads?: Map<string, typeof uploadMeta> };
    if (!g.__tusUploads) g.__tusUploads = new Map();
    g.__tusUploads.set(uploadId, uploadMeta);

    // Clean up old uploads (>2h)
    for (const [id, meta] of g.__tusUploads) {
      if (Date.now() - meta.createdAt > 2 * 60 * 60 * 1000) {
        g.__tusUploads.delete(id);
      }
    }

    return NextResponse.json({
      uploadId,
      key,
      totalParts,
      partSize: PART_SIZE,
      fileSize,
    });
  } catch (err) {
    console.error("Erro ao iniciar multipart upload:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
