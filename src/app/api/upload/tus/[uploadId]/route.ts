import { NextRequest, NextResponse } from "next/server";
import { S3Client, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

function getUploadMeta(uploadId: string) {
  const g = globalThis as typeof globalThis & { __tusUploads?: Map<string, any> };
  return g.__tusUploads?.get(uploadId) ?? null;
}

function deleteUploadMeta(uploadId: string) {
  const g = globalThis as typeof globalThis & { __tusUploads?: Map<string, any> };
  g.__tusUploads?.delete(uploadId);
}

// GET: Get presigned URL for a specific part
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { uploadId } = await params;
    const partNumber = parseInt(req.nextUrl.searchParams.get("partNumber") || "0");

    if (!partNumber || partNumber < 1) {
      return NextResponse.json({ error: "partNumber inválido." }, { status: 400 });
    }

    const meta = getUploadMeta(uploadId);
    if (!meta) {
      return NextResponse.json({ error: "Upload não encontrado ou expirado." }, { status: 404 });
    }

    if (meta.createdBy !== uid) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const command = new UploadPartCommand({
      Bucket: meta.bucket,
      Key: meta.key,
      UploadId: uploadId,
      PartNumber: partNumber,
      ContentLength: partNumber < meta.totalParts ? meta.partSize : meta.fileSize - (meta.partSize * (meta.totalParts - 1)),
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1h

    return NextResponse.json({ presignedUrl, partNumber });
  } catch (err) {
    console.error("Erro ao gerar presigned URL da parte:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// POST: Complete the multipart upload
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { uploadId } = await params;
    const { parts } = await req.json() as { parts: { partNumber: number; ETag: string }[] };

    const meta = getUploadMeta(uploadId);
    if (!meta) {
      return NextResponse.json({ error: "Upload não encontrado ou expirado." }, { status: 404 });
    }

    if (meta.createdBy !== uid) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    if (!parts || parts.length !== meta.totalParts) {
      return NextResponse.json({ error: `Esperado ${meta.totalParts} partes, recebido ${parts?.length ?? 0}.` }, { status: 400 });
    }

    const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

    const command = new CompleteMultipartUploadCommand({
      Bucket: meta.bucket,
      Key: meta.key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sortedParts },
    });

    await s3.send(command);
    deleteUploadMeta(uploadId);

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${meta.key}`;

    return NextResponse.json({ success: true, url: publicUrl, key: meta.key });
  } catch (err) {
    console.error("Erro ao completar multipart upload:", err);
    return NextResponse.json({ error: "Erro ao finalizar upload." }, { status: 500 });
  }
}

// DELETE: Abort/cancel the multipart upload
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> }
) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { uploadId } = await params;
    const meta = getUploadMeta(uploadId);
    if (!meta) {
      return NextResponse.json({ error: "Upload não encontrado." }, { status: 404 });
    }

    if (meta.createdBy !== uid) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    try {
      await s3.send(new AbortMultipartUploadCommand({
        Bucket: meta.bucket,
        Key: meta.key,
        UploadId: uploadId,
      }));
    } catch {}

    deleteUploadMeta(uploadId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao cancelar upload:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
