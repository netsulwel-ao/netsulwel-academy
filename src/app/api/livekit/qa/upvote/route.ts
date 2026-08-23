import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/qa/upvote
 * Atomic upvote/downvote using Firestore transaction (no race conditions)
 *
 * Body: { liveId, questionId, action: "upvote" | "downvote" | "remove" }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, questionId, action } = await req.json();

    if (!liveId || !questionId || !action) {
      return Response.json({ error: "liveId, questionId e action são obrigatórios." }, { status: 400 });
    }

    if (!["upvote", "downvote", "remove"].includes(action)) {
      return Response.json({ error: "action deve ser 'upvote', 'downvote' ou 'remove'." }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const questionRef = db.collection("lives").doc(liveId).collection("qa_questions").doc(questionId);
    const voteRef = questionRef.collection("votes").doc(uid);

    // Atomic transaction: read current state + write new state in one operation
    const result = await db.runTransaction(async (tx) => {
      const [questionSnap, voteSnap] = await Promise.all([tx.get(questionRef), tx.get(voteRef)]);

      if (!questionSnap.exists) {
        throw new Error("Pergunta não encontrada.");
      }

      const currentUpvotes = questionSnap.data()?.upvotes || 0;
      const previousVote = voteSnap.data()?.vote as string | undefined;
      let newUpvotes = currentUpvotes;

      // Remove previous vote effect
      if (previousVote === "upvote") newUpvotes -= 1;
      else if (previousVote === "downvote") newUpvotes += 1;

      if (action === "remove") {
        if (voteSnap.exists) tx.delete(voteRef);
      } else {
        // Apply new vote effect
        if (action === "upvote") newUpvotes += 1;
        else if (action === "downvote") newUpvotes -= 1;

        tx.set(voteRef, { vote: action, votedAt: new Date().toISOString() });
      }

      newUpvotes = Math.max(0, newUpvotes);
      tx.update(questionRef, { upvotes: newUpvotes });

      return { upvotes: newUpvotes };
    });

    return Response.json({ success: true, upvotes: result.upvotes });
  } catch (error: any) {
    if (error.message === "Pergunta não encontrada.") {
      return Response.json({ error: error.message }, { status: 404 });
    }
    console.error("Erro ao votar em pergunta:", error);
    return Response.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
