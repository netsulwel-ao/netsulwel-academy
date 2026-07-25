import { auth } from "@/lib/firebase";

interface TusUploadOptions {
  file: File;
  folder?: string;
  onProgress?: (percent: number) => void;
  onChunkComplete?: (partNumber: number, totalParts: number) => void;
}

interface UploadInitResponse {
  uploadId: string;
  key: string;
  totalParts: number;
  partSize: number;
  fileSize: number;
}

interface UploadState {
  uploadId: string;
  key: string;
  totalParts: number;
  partSize: number;
  fileSize: number;
  completedParts: { partNumber: number; ETag: string }[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Não autenticado.");
  return user.getIdToken();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadChunkWithRetry(
  presignedUrl: string,
  chunk: Blob,
  partNumber: number,
  retries = MAX_RETRIES
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const etag = res.headers.get("ETag");
      if (!etag) throw new Error("ETag não recebido.");
      return etag;
    } catch (err) {
      if (attempt === retries) throw err;
      await delay(RETRY_DELAY_MS * attempt);
    }
  }
  throw new Error("Upload falhou após múltiplas tentativas.");
}

export async function uploadLargeFile({
  file,
  folder = "videos",
  onProgress,
  onChunkComplete,
}: TusUploadOptions): Promise<string> {
  const token = await getToken();

  // Step 1: Initiate multipart upload
  const initRes = await fetch("/api/upload/tus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder,
      fileSize: file.size,
    }),
  });

  if (!initRes.ok) {
    const data = await initRes.json();
    throw new Error(data.error || "Falha ao iniciar upload.");
  }

  const { uploadId, totalParts, partSize }: UploadInitResponse = await initRes.json();

  // Restore state from localStorage if resuming
  const storageKey = `tus_upload_${uploadId}`;
  let state: UploadState = (() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      uploadId,
      key: "",
      totalParts,
      partSize,
      fileSize: file.size,
      completedParts: [],
    };
  })();

  // Step 2: Upload each part
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    // Skip already completed parts
    if (state.completedParts.some((p) => p.partNumber === partNumber)) {
      onProgress?.(Math.round((partNumber / totalParts) * 100));
      continue;
    }

    const start = (partNumber - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    const chunk = file.slice(start, end);

    // Get presigned URL for this part
    const presignRes = await fetch(`/api/upload/tus/${uploadId}?partNumber=${partNumber}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!presignRes.ok) {
      const data = await presignRes.json();
      throw new Error(data.error || `Falha ao obter URL para parte ${partNumber}.`);
    }

    const { presignedUrl } = await presignRes.json();

    // Upload chunk with retry
    const etag = await uploadChunkWithRetry(presignedUrl, chunk, partNumber);

    state.completedParts.push({ partNumber, ETag: etag });

    // Save state for resume
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}

    const percent = Math.round((partNumber / totalParts) * 100);
    onProgress?.(percent);
    onChunkComplete?.(partNumber, totalParts);
  }

  // Step 3: Complete the upload
  const completeRes = await fetch(`/api/upload/tus/${uploadId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ parts: state.completedParts }),
  });

  if (!completeRes.ok) {
    const data = await completeRes.json();
    throw new Error(data.error || "Falha ao finalizar upload.");
  }

  const { url } = await completeRes.json();

  // Clean up
  try {
    localStorage.removeItem(storageKey);
  } catch {}

  return url;
}

export async function cancelUpload(uploadId: string): Promise<void> {
  try {
    const token = await getToken();
    await fetch(`/api/upload/tus/${uploadId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}
