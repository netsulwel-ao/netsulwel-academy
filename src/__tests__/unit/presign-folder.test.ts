/**
 * Unit tests — /api/upload/presign
 * Testa que o folder param é validado contra whitelist.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockVerifyAuth = vi.fn();
const mockGetSignedUrl = vi.fn().mockResolvedValue("https://r2.example.com/presigned");

vi.mock("@/lib/api-auth", () => ({ verifyAuth: mockVerifyAuth }));
vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: mockGetSignedUrl }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...actual,
    S3Client: vi.fn(function(this: unknown) {}),
    PutObjectCommand: vi.fn(function(this: unknown, input: unknown) { return input; }),
  };
});
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return { ...actual, randomUUID: () => "test-uuid" };
});

process.env.R2_ENDPOINT = "https://r2.example.com";
process.env.R2_ACCESS_KEY_ID = "key";
process.env.R2_SECRET_ACCESS_KEY = "secret";
process.env.R2_BUCKET_NAME = "bucket";
process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub.r2.example.com";

const { POST } = await import("@/app/api/upload/presign/route");

function makeRequest(body: object) {
  return new NextRequest("http://localhost/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer valid_token",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/presign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyAuth.mockResolvedValue({ uid: "user_1", error: null });
  });

  it("retorna 401 se não autenticado", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: null, error: "Não autorizado." });
    const res = await POST(makeRequest({ filename: "img.jpg", contentType: "image/jpeg" }));
    expect(res.status).toBe(401);
  });

  it("retorna 400 se filename em falta", async () => {
    const res = await POST(makeRequest({ contentType: "image/jpeg" }));
    expect(res.status).toBe(400);
  });

  it("retorna 400 para folder inválido (path traversal)", async () => {
    const res = await POST(makeRequest({
      filename: "evil.jpg",
      contentType: "image/jpeg",
      folder: "../../etc/passwd",
    }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/inválida/i);
  });

  it("retorna 400 para folder não permitido", async () => {
    const res = await POST(makeRequest({
      filename: "file.jpg",
      contentType: "image/jpeg",
      folder: "admin_secrets",
    }));
    expect(res.status).toBe(400);
  });

  it("aceita folders da whitelist", async () => {
    const allowedFolders = ["thumbnails", "videos", "announcements", "avatars"];
    for (const folder of allowedFolders) {
      const res = await POST(makeRequest({
        filename: "file.jpg",
        contentType: "image/jpeg",
        folder,
      }));
      expect(res.status).toBe(200);
    }
  });

  it("retorna presignedUrl e publicUrl com folder correto", async () => {
    const res = await POST(makeRequest({
      filename: "photo.png",
      contentType: "image/png",
      folder: "thumbnails",
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("presignedUrl");
    expect(body).toHaveProperty("publicUrl");
    // publicUrl deve conter o folder e a extensão correta
    expect(body.publicUrl).toContain("thumbnails/");
    expect(body.publicUrl).toMatch(/\.png$/);
    expect(body.publicUrl).toContain("https://pub.r2.example.com");
  });
});
