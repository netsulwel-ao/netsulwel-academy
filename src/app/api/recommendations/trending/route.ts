import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getFirebaseAdmin();
    const firestore = admin.firestore();

    // Last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const eventsSnap = await firestore
      .collection("events")
      .where("type", "in", ["course_view", "course_enroll", "lesson_complete"])
      .where("createdAt", ">=", weekAgo)
      .get();

    const score: Record<string, number> = {};

    eventsSnap.forEach((doc) => {
      const data = doc.data();
      const targetId = data.targetId;
      if (!targetId) return;
      const weight =
        data.type === "course_view" ? 1
        : data.type === "lesson_complete" ? 3
        : data.type === "course_enroll" ? 5
        : 1;
      score[targetId] = (score[targetId] || 0) + weight;
    });

    const topIds = Object.entries(score)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id]) => id);

    if (topIds.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    // Fetch course docs
    const coursesSnap = await firestore
      .collection("courses")
      .where("__name__", "in", topIds)
      .get();

    const courses = coursesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c: Record<string, unknown>) => c.status === "published")
      .sort((a, b) => topIds.indexOf(a.id as string) - topIds.indexOf(b.id as string));

    return NextResponse.json({ courses });
  } catch {
    return NextResponse.json({ courses: [] });
  }
}
