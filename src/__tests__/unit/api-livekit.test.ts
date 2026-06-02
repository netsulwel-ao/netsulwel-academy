/**
 * Unit tests — /api/livekit/token
 * Testa que identity vem do servidor e isHost não é controlado pelo cliente.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mocks
const mockVerifyAuth = vi.fn();
const mockGetUserDoc = vi.fn();
const mockToJwt = vi.fn().mockResolvedValue("mock_jwt_token");
const mockAddGrant = vi.fn();

// AccessToken precisa ser mockado como classe (constructor)
const MockAccessToken = vi.fn(function(this: Record<string, unknown>, _key: string, _secret: string, opts: { identity: string }) {
  this.identity = opts.identity;
  this.addGrant = mockAddGrant;
  this.toJwt = mockToJwt;
});

vi.mock("@/lib/api-auth", () => ({ verifyAuth: mockVerifyAuth }));
vi.mock("livekit-server-sdk", () => ({
  AccessToken: MockAccessToken,
  TrackSource: { MICROPHONE: "microphone" },
}));
vi.mock("@/lib/firebase-admin", () => ({
  getFirebaseAdmin: () => ({
    firestore: () => ({
      collection: () => ({
        doc: () => ({ get: mockGetUserDoc }),
      }),
    }),
  }),
}));

const { POST } = await import("@/app/api/livekit/token/route");

function makeRequest(body: object, token = "valid_token") {
  return new NextRequest("http://localhost/api/livekit/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/livekit/token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.LIVEKIT_API_KEY = "test_key";
    process.env.LIVEKIT_API_SECRET = "test_secret";
  });

  it("retorna 401 se não autenticado", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: null, error: "Token inválido." });
    const res = await POST(makeRequest({ roomName: "room", name: "User" }));
    expect(res.status).toBe(401);
  });

  it("retorna 400 se roomName ou name em falta", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: "user_1", error: null });
    const res = await POST(makeRequest({ name: "User" })); // sem roomName
    expect(res.status).toBe(400);
  });

  it("usa o uid do servidor como identity — nunca o do cliente", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: "server_uid_123", error: null });
    mockGetUserDoc.mockResolvedValue({ exists: true, data: () => ({ role: "aluno" }) });

    await POST(makeRequest({
      roomName: "room-test",
      name: "Aluno Teste",
      identity: "hacker_identity", // tentativa de injeção — deve ser ignorado
      isHost: true,                // tentativa de escalada — deve ser ignorado
    }));

    // Verifica que o AccessToken foi criado com o UID do servidor
    expect(MockAccessToken).toHaveBeenCalledWith(
      "test_key",
      "test_secret",
      expect.objectContaining({ identity: "server_uid_123" })
    );
  });

  it("aluno NÃO recebe permissão de host (canPublishSources restrito)", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: "aluno_uid", error: null });
    mockGetUserDoc.mockResolvedValue({ exists: true, data: () => ({ role: "aluno" }) });

    await POST(makeRequest({ roomName: "room", name: "Aluno" }));

    expect(mockAddGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        canPublishSources: ["microphone"], // restrito ao microfone
      })
    );
  });

  it("teacher recebe permissão de host completa", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: "teacher_uid", error: null });
    mockGetUserDoc.mockResolvedValue({ exists: true, data: () => ({ role: "teacher" }) });

    await POST(makeRequest({ roomName: "room", name: "Professor" }));

    expect(mockAddGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        canPublishSources: undefined, // pode publicar tudo
      })
    );
  });

  it("retorna token JWT válido", async () => {
    mockVerifyAuth.mockResolvedValue({ uid: "user_1", error: null });
    mockGetUserDoc.mockResolvedValue({ exists: true, data: () => ({ role: "aluno" }) });

    const res = await POST(makeRequest({ roomName: "room", name: "User" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBe("mock_jwt_token");
  });
});
