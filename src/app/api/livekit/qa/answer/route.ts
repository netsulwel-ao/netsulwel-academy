import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/qa/answer
 * Professor answers a question
 * 
 * Body:
 * {
 *   liveId: string,
 *   questionId: string,
 *   answer: string,
 *   action: "answer" | "dismiss"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, questionId, answer, action } = await req.json();

    if (!liveId || !questionId) {
      return Response.json(
        { error: "liveId e questionId são obrigatórios." },
        { status: 400 }
      );
    }

    if (action !== "answer" && action !== "dismiss") {
      return Response.json(
        { error: "action deve ser 'answer' ou 'dismiss'." },
        { status: 400 }
      );
    }

    if (action === "answer" && (!answer || answer.trim().length === 0)) {
      return Response.json(
        { error: "answer é obrigatório quando action é 'answer'." },
        { status: 400 }
      );
    }

    // Verify user is teacher for this live session
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();

    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }

    const liveData = liveDoc.data();
    if (liveData?.createdBy !== uid) {
      return Response.json(
        { error: "Apenas o professor pode responder perguntas." },
        { status: 403 }
      );
    }

    // Get question
    const questionDoc = await admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions")
      .doc(questionId)
      .get();

    if (!questionDoc.exists) {
      return Response.json({ error: "Pergunta não encontrada." }, { status: 404 });
    }

    const questionData = questionDoc.data();
    const askedByUid = questionData?.askedBy;

    // Get teacher details
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();
    const displayName = userData?.displayName || "Professor";

    if (action === "answer") {
      // Add answer to question
      const answersArray = questionData?.answers || [];
      answersArray.push({
        id: Date.now().toString(),
        answer: answer.trim(),
        answeredBy: uid,
        answeredByName: displayName,
        answeredAt: new Date().toISOString(),
      });

      await admin
        .firestore()
        .collection("lives")
        .doc(liveId)
        .collection("qa_questions")
        .doc(questionId)
        .update({
          answers: answersArray,
          status: "answered",
          updatedAt: new Date().toISOString(),
        });

      // Notify student that their question was answered
      await notifyStudentAnswered(admin, askedByUid, liveId, answer);
    } else if (action === "dismiss") {
      // Dismiss the question
      await admin
        .firestore()
        .collection("lives")
        .doc(liveId)
        .collection("qa_questions")
        .doc(questionId)
        .update({
          status: "dismissed",
          updatedAt: new Date().toISOString(),
        });
    }

    return Response.json({
      success: true,
      message: `Pergunta ${action === "answer" ? "respondida" : "dispensada"} com sucesso.`,
    });
  } catch (error) {
    console.error("Erro ao responder pergunta:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function notifyStudentAnswered(
  admin: any,
  studentUid: string,
  liveId: string,
  answer: string
) {
  try {
    await admin
      .firestore()
      .collection("users")
      .doc(studentUid)
      .collection("notifications")
      .add({
        uid: studentUid,
        type: "question_answered",
        title: "Sua Pergunta Foi Respondida",
        message: `Resposta: "${answer.substring(0, 100)}..."`,
        read: false,
        createdAt: new Date().toISOString(),
      });
  } catch (error) {
    console.error("Error notifying student:", error);
  }
}
