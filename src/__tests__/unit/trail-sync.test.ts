/**
 * Unit tests — syncCourseTrail
 * Testa que o courseId é adicionado/removido do Trail correto.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock das funções do Firestore
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockDoc = vi.fn((_, ...segments) => segments.join("/"));
const mockArrayUnion = vi.fn((val) => ({ __arrayUnion: val }));
const mockArrayRemove = vi.fn((val) => ({ __arrayRemove: val }));
const mockIncrement = vi.fn((val) => ({ __increment: val }));

vi.mock("firebase/firestore", () => ({
  updateDoc: mockUpdateDoc,
  doc: mockDoc,
  arrayUnion: mockArrayUnion,
  arrayRemove: mockArrayRemove,
  increment: mockIncrement,
}));

vi.mock("@/lib/firebase", () => ({ db: {} }));

// Import após mocks
const { syncCourseTrail } = await import("@/lib/trail-sync");

describe("syncCourseTrail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("adiciona curso ao novo trail quando não havia trail anterior", async () => {
    await syncCourseTrail("course_1", "trail_A", undefined);

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        courseIds: expect.objectContaining({ __arrayUnion: "course_1" }),
        coursesCount: expect.objectContaining({ __increment: 1 }),
      })
    );
  });

  it("remove do trail anterior e adiciona ao novo", async () => {
    await syncCourseTrail("course_1", "trail_B", "trail_A");

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);

    // Remover do trail_A
    const removeCall = mockUpdateDoc.mock.calls.find((c) =>
      JSON.stringify(c[1]).includes("__arrayRemove")
    );
    expect(removeCall).toBeDefined();
    expect(removeCall?.[1]).toMatchObject({
      courseIds: { __arrayRemove: "course_1" },
      coursesCount: { __increment: -1 },
    });

    // Adicionar ao trail_B
    const addCall = mockUpdateDoc.mock.calls.find((c) =>
      JSON.stringify(c[1]).includes("__arrayUnion")
    );
    expect(addCall).toBeDefined();
    expect(addCall?.[1]).toMatchObject({
      courseIds: { __arrayUnion: "course_1" },
      coursesCount: { __increment: 1 },
    });
  });

  it("remove do trail anterior quando novo trail é undefined", async () => {
    await syncCourseTrail("course_1", undefined, "trail_A");

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ courseIds: { __arrayRemove: "course_1" } })
    );
  });

  it("não faz nada se não há trail anterior nem novo", async () => {
    await syncCourseTrail("course_1", undefined, undefined);
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it("não faz nada se trail não mudou", async () => {
    await syncCourseTrail("course_1", "trail_A", "trail_A");
    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });
});
