import { db } from "@/lib/firebase";
import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import type { ModuleQuiz, ModuleQuizResult, ModuleQuizQuestion } from "@/types/quiz";

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

/** Submeter respostas e calcular nota */
export async function submitQuizAnswers(
  userId: string, userName: string,
  quiz: ModuleQuiz, answers: Record<string, number>,
): Promise<{ score: number; passed: boolean; resultId: string }> {
  let correct = 0;
  quiz.questions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) correct++;
  });
  const total = quiz.questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = score >= quiz.passingScore;

  const resultsRef = collection(db, "moduleQuizResults", userId, "quizzes");

  const existingSnap = await getDocs(
    query(resultsRef, where("quizId", "==", quiz.id)),
  );
  const attempt = existingSnap.size + 1;

  const resultData: Omit<ModuleQuizResult, "id"> & { completedAt: ReturnType<typeof serverTimestamp> } = {
    quizId: quiz.id!,
    courseId: quiz.courseId,
    moduleIndex: quiz.moduleIndex,
    userId,
    userName,
    score,
    passed,
    answers,
    completedAt: serverTimestamp() as any,
    attempt,
  };

  const ref = await addDoc(resultsRef, resultData);
  return { score, passed, resultId: ref.id };
}
