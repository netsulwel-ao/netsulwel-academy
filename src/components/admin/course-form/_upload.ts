import { auth } from "@/lib/firebase";
import { uploadLargeFile } from "@/lib/tus-upload";

const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50 MB

async function presign(file: File, folder: string) {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  if (!res.ok) throw new Error("Falha ao obter URL de upload.");
  return res.json() as Promise<{ presignedUrl: string; publicUrl: string }>;
}

export async function uploadThumbnail(file: File): Promise<string> {
  const { presignedUrl, publicUrl } = await presign(file, "thumbnails");
  const up = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!up.ok) throw new Error("Falha ao enviar miniatura.");
  return publicUrl;
}

export async function uploadVideo(
  file: File,
  onProgress: (p: number) => void
): Promise<string> {
  if (file.size > LARGE_FILE_THRESHOLD) {
    return uploadLargeFile({ file, folder: "videos", onProgress });
  }
  const { presignedUrl, publicUrl } = await presign(file, "videos");
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Erro de rede."));
    xhr.send(file);
  });
  return publicUrl;
}
