/**
 * Sincroniza o courseIds de uma trilha quando um curso é criado ou editado.
 * Garante que Trail.courseIds está sempre atualizado e Trail.coursesCount correto.
 */
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";

export async function syncCourseTrail(
  courseId: string,
  newTrailId: string | undefined,
  previousTrailId: string | undefined,
  trailOrder?: number,
) {
  // Nada a fazer se trail não mudou e não há trail
  if (!newTrailId && !previousTrailId) return;

  const promises: Promise<void>[] = [];

  // Remover do trail anterior (se mudou de trail)
  if (previousTrailId && previousTrailId !== newTrailId) {
    promises.push(
      updateDoc(doc(db, "trails", previousTrailId), {
        courseIds: arrayRemove(courseId),
        coursesCount: increment(-1),
      }).catch(console.error)
    );
  }

  // Adicionar ao novo trail
  if (newTrailId && newTrailId !== previousTrailId) {
    promises.push(
      updateDoc(doc(db, "trails", newTrailId), {
        courseIds: arrayUnion(courseId),
        coursesCount: increment(1),
      }).catch(console.error)
    );
  }

  await Promise.all(promises);
}
