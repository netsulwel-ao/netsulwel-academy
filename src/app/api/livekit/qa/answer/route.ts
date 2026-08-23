import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/qa/answer
 * Professor answers a question (atomic — uses FieldValue.arrayUnion)
 *
 * Body: { liveId, questionId, answer, action: "answer" | "dismiss" }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, questionId, answer, action } = await req.json();

    if (!liveId || !questionId) {
      return Response.json({ error: "liveId e questionId são obrigatórios." }, { status: 400 });
    }

    if (action !== "answer" && action !== "dismiss") {
      return Response.json({ error: "action deve ser 'answer' ou 'dismiss'." }, { status: 400 });
    }

    if (action === "answer" && (!answer || answer.trim().length === 0)) {
      return Response.json({ error: "answer é obrigatório quando action é 'answer'." }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const liveRef = db.collection("lives").doc(liveId);
    const questionRef = liveRef.collection("qa_questions").doc(questionId);

    // Verify live exists and user is the teacher
    const liveDoc = await liveRef.get();
    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }
    if (liveDoc.data()?.createdBy !== uid) {
      return Response.json({ error: "Apenas o professor pode responder perguntas." }, { status: 403 });
    }

    // Verify question exists
    const questionDoc = await questionRef.get();
    if (!questionDoc.exists) {
      return Response.json({ error: "Pergunta não encontrada." }, { status: 404 });
    }

    // Get teacher display name
    const userDoc = await db.collection("users").doc(uid).get();
    const displayName = userDoc.data()?.displayName || "Professor";

    if (action === "answer") {
      // Atomic: use arrayUnion instead of read-modify-write
      const { FieldValue } = await import("firebase-admin/firestore");
      await questionRef.update({
        answers: FieldValue.arrayUnion({
          id: Date.now().toString(),
          answer: answer.trim(),
          answeredBy: uid,
          answeredByName: displayName,
          answeredAt: new Date().toISOString(),
        }),
        status: "answered",
      });

      // Notify student
      const askedByUid = questionDoc.data()?.askedBy;
      if (askedByUid) {
        try {
          await db.collection("users").doc(askedByUid).collection("notifications").add({
            uid: askedByUid,
            type: "question_answered",
            title: "Sua Pergunta Foi Respondida",
            message: `Resposta: "${answer.substring(0, 100)}..."`,
            read: false,
            createdAt: new Date().toISOString(),
          });
        } catch { /* non-critical */ }
      }
    } else {
      await questionRef.update({ status: "dismissed" });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao responder pergunta:", error);
    return Response.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
