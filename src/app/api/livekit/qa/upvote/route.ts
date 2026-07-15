import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/qa/upvote
 * Upvote or downvote a question
 * 
 * Body:
 * {
 *   liveId: string,
 *   questionId: string,
 *   action: "upvote" | "downvote" | "remove"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, questionId, action } = await req.json();

    if (!liveId || !questionId || !action) {
      return Response.json(
        { error: "liveId, questionId e action são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["upvote", "downvote", "remove"].includes(action)) {
      return Response.json(
        { error: "action deve ser 'upvote', 'downvote' ou 'remove'." },
        { status: 400 }
      );
    }

    const admin = getFirebaseAdmin();

    // Check if user already voted
    const votesRef = admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions")
      .doc(questionId)
      .collection("votes")
      .doc(uid);

    const existingVote = await votesRef.get();
    let currentUpvotes = 0;

    // Get current upvote count
    const questionDoc = await admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions")
      .doc(questionId)
      .get();

    if (questionDoc.exists) {
      currentUpvotes = questionDoc.data()?.upvotes || 0;
    } else {
      return Response.json({ error: "Pergunta não encontrada." }, { status: 404 });
    }

    // Update vote
    if (action === "remove") {
      // Remove existing vote
      if (existingVote.exists) {
        const previousVote = existingVote.data()?.vote;
        if (previousVote === "upvote") {
          currentUpvotes = Math.max(0, currentUpvotes - 1);
        } else if (previousVote === "downvote") {
          currentUpvotes = Math.min(10000, currentUpvotes + 1); // Assuming min downvotes don't go negative
        }
        await votesRef.delete();
      }
    } else {
      // Add or update vote
      if (existingVote.exists) {
        const previousVote = existingVote.data()?.vote;
        
        // Remove previous vote effect
        if (previousVote === "upvote") {
          currentUpvotes = Math.max(0, currentUpvotes - 1);
        } else if (previousVote === "downvote") {
          currentUpvotes = Math.min(10000, currentUpvotes + 1);
        }
      }

      // Apply new vote effect
      if (action === "upvote") {
        currentUpvotes += 1;
      } else if (action === "downvote") {
        currentUpvotes = Math.max(0, currentUpvotes - 1);
      }

      await votesRef.set({
        vote: action,
        votedAt: new Date().toISOString(),
      });
    }

    // Update question upvote count
    await admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions")
      .doc(questionId)
      .update({
        upvotes: currentUpvotes,
        updatedAt: new Date().toISOString(),
      });

    return Response.json({
      success: true,
      upvotes: currentUpvotes,
      message: "Voto atualizado com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao votar em pergunta:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
