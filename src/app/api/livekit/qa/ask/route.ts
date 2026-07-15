import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/qa/ask
 * Student submits a question
 * 
 * Body:
 * {
 *   liveId: string,
 *   question: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, question } = await req.json();

    if (!liveId || !question || question.trim().length === 0) {
      return Response.json(
        { error: "liveId e question são obrigatórios." },
        { status: 400 }
      );
    }

    if (question.length > 1000) {
      return Response.json(
        { error: "Pergunta demasiado longa (máximo 1000 caracteres)." },
        { status: 400 }
      );
    }

    // Verify live session exists and is active
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();

    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }

    const liveData = liveDoc.data();
    if (liveData?.status !== "live") {
      return Response.json(
        { error: "Esta aula não está ativa." },
        { status: 400 }
      );
    }

    // Get user details
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();
    const displayName = userData?.displayName || "Utilizador Anónimo";

    // Create question document
    const questionRef = admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("qa_questions")
      .doc();

    const questionData = {
      id: questionRef.id,
      question: question.trim(),
      askedBy: uid,
      askedByName: displayName,
      askedAt: new Date().toISOString(),
      answers: [],
      status: "pending",
      upvotes: 0,
      createdAt: new Date().toISOString(),
    };

    await questionRef.set(questionData);

    // Notify teacher that a new question was asked
    await notifyTeacher(admin, liveId, displayName, question);

    return Response.json({
      success: true,
      questionId: questionRef.id,
      message: "Pergunta enviada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao submeter pergunta:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function notifyTeacher(
  admin: any,
  liveId: string,
  askerName: string,
  question: string
) {
  try {
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();
    const teacherId = liveDoc.data()?.createdBy;

    if (teacherId) {
      await admin
        .firestore()
        .collection("notifications")
        .add({
          userId: teacherId,
          liveId,
          type: "new_question",
          title: "Nova Pergunta",
          message: `${askerName}: "${question.substring(0, 100)}..."`,
          read: false,
          createdAt: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("Error notifying teacher:", error);
  }
}
