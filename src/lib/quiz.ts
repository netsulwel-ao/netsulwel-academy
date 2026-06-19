import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import type { ModuleQuiz, ModuleQuizResult } from "@/types/quiz";

/** Busca quizzes de um curso */
export function listenCourseQuizzes(courseId: string, callback: (quizzes: ModuleQuiz[]) => void) {
  const q = query(
    collection(db, "moduleQuizzes"),
    where("courseId", "==", courseId),
    orderBy("moduleIndex", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModuleQuiz)));
  });
}

/** Busca um quiz pelo ID */
export async function getQuiz(quizId: string): Promise<ModuleQuiz | null> {
  const snap = await getDoc(doc(db, "moduleQuizzes", quizId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ModuleQuiz) : null;
}

/** Cria um novo quiz */
export async function createQuiz(data: Omit<ModuleQuiz, "id" | "createdAt" | "updatedAt">) {
  const ref = await addDoc(collection(db, "moduleQuizzes"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Actualiza um quiz */
export async function updateQuiz(quizId: string, data: Partial<ModuleQuiz>) {
  await updateDoc(doc(db, "moduleQuizzes", quizId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Remove um quiz */
export async function deleteQuiz(quizId: string) {
  await deleteDoc(doc(db, "moduleQuizzes", quizId));
}

/** Gera um ID único para pergunta */
export function generateQuestionId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/** Resultados do utilizador para quizzes de um curso */
export function listenQuizResults(userId: string, courseId: string, callback: (results: ModuleQuizResult[]) => void) {
  const q = query(
    collection(db, "moduleQuizResults", userId, "quizzes"),
    where("courseId", "==", courseId),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ModuleQuizResult)));
  });
}

/** Retorna índices dos módulos que têm quiz num curso */
export async function getQuizModules(courseId: string): Promise<number[]> {
  const snap = await getDocs(query(
    collection(db, "moduleQuizzes"),
    where("courseId", "==", courseId),
  ));
  return snap.docs.map((d) => d.data().moduleIndex as number);
}

/** Submeter respostas via API (validação server-side) */
export async function submitQuizAnswers(
  userId: string, userName: string,
  quiz: ModuleQuiz, answers: Record<string, number>,
): Promise<{ score: number; passed: boolean; resultId: string; questionResults: { questionId: string; correct: boolean }[] }> {
  const { getAuth } = await import("firebase/auth");
  const token = await getAuth().currentUser?.getIdToken();

  const res = await fetch("/api/quiz/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      quizId: quiz.id,
      answers,
      userName,
      courseId: quiz.courseId,
      moduleIndex: quiz.moduleIndex,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao submeter quiz");
  }

  return res.json();
}
