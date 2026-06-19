import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  const { uid, error } = await verifyAuth(request);
  if (error || !uid) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { quizId, answers, userName, courseId, moduleIndex } = await request.json();

  if (!quizId || !answers || !userName) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const quizSnap = await db.collection("moduleQuizzes").doc(quizId).get();
    if (!quizSnap.exists) {
      return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });
    }

    const quizData = quizSnap.data()!;
    const questions = quizData.questions || [];

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctAnswer) correct++;
    }
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const passed = score >= (quizData.passingScore || 70);

    const resultsRef = db.collection("moduleQuizResults").doc(uid).collection("quizzes");
    const existingSnap = await resultsRef.where("quizId", "==", quizId).get();
    const attempt = existingSnap.size + 1;

    if (attempt > (quizData.maxAttempts || 3)) {
      return NextResponse.json({ error: "Máximo de tentativas excedido" }, { status: 400 });
    }

    const resultRef = await resultsRef.add({
      quizId,
      courseId: courseId || quizData.courseId,
      moduleIndex: moduleIndex ?? quizData.moduleIndex,
      userId: uid,
      userName,
      score,
      passed,
      answers,
      completedAt: Timestamp.now(),
      attempt,
    });

    const questionResults = questions.map((q: { id: string; correctAnswer: number }) => ({
      questionId: q.id,
      correct: answers[q.id] === q.correctAnswer,
    }));

    return NextResponse.json({ score, passed, attempt, resultId: resultRef.id, questionResults });
  } catch (err) {
    console.error("Erro ao submeter quiz:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
