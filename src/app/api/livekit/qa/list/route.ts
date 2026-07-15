import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * GET /api/livekit/qa/list?liveId=...&status=...&limit=...&offset=...
 * Get list of Q&A questions with pagination
 * 
 * Query params:
 * - liveId: string (required)
 * - status: "pending" | "answered" | "dismissed" | "all" (optional, default: "all")
 * - limit: number (optional, default: 20, max: 100)
 * - offset: number (optional, default: 0)
 * - sortBy: "newest" | "popular" (optional, default: "newest")
 */
export async function GET(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const url = new URL(req.url);
    const liveId = url.searchParams.get("liveId");
    const status = url.searchParams.get("status") || "all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const sortBy = url.searchParams.get("sortBy") || "newest";

    if (!liveId) {
      return Response.json(
        { error: "liveId é obrigatório." },
        { status: 400 }
      );
    }

    // Verify live session exists
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();

    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }

    // Build query
    let query: any = admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions");

    // Filter by status if not "all"
    if (status !== "all") {
      query = query.where("status", "==", status);
    }

    // Sort
    if (sortBy === "popular") {
      query = query.orderBy("upvotes", "desc");
    } else {
      query = query.orderBy("askedAt", "desc");
    }

    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;

    // Get paginated results
    const snapshot = await query
      .offset(offset)
      .limit(limit)
      .get();

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return Response.json({
      questions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Erro ao listar perguntas:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
