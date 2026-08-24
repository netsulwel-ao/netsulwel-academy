import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { uid, error } = await verifyAuth(req);
    if (error || !uid) {
      return NextResponse.json({ error: error || "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    const isInstAdmin = userData?.institutionId === id && (userData?.institutionRole === "admin" || userData?.role === "institution");
    const isGlobalAdmin = userData?.role === "admin";
    if (!isInstAdmin && !isGlobalAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    // Get teacher UIDs from users collection
    const usersSnap = await db
      .collection("users")
      .where("institutionId", "==", id)
      .where("institutionRole", "==", "teacher")
      .get();
    const teacherUids = usersSnap.docs.map(d => d.id);

    // Get teacher UIDs from institutionMembers collection
    const membersSnap = await db
      .collection("institutionMembers")
      .where("institutionId", "==", id)
      .where("status", "==", "active")
      .where("role", "==", "teacher")
      .get();
    membersSnap.docs.forEach(d => {
      const uid = d.data().userId;
      if (!teacherUids.includes(uid)) teacherUids.push(uid);
    });

    if (teacherUids.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    // Fetch courses — chunk into batches of 30 (Firestore "in" limit)
    const allCourses: Array<Record<string, unknown> & { id: string }> = [];
    const chunks: string[][] = [];
    for (let i = 0; i < teacherUids.length; i += 30) {
      chunks.push(teacherUids.slice(i, i + 30));
    }

    await Promise.all(chunks.map(async chunk => {
      const snap = await db
        .collection("courses")
        .where("createdBy", "in", chunk)
        .get();
      snap.docs.forEach(d => allCourses.push({ id: d.id, ...d.data() }));
    }));

    // Sort by createdAt descending
    allCourses.sort((a, b) => {
      const aRaw = a.createdAt as { toDate?: () => Date } | undefined;
      const bRaw = b.createdAt as { toDate?: () => Date } | undefined;
      const aTime = aRaw?.toDate?.()?.getTime?.() ?? 0;
      const bTime = bRaw?.toDate?.()?.getTime?.() ?? 0;
      return bTime - aTime;
    });

    return NextResponse.json({ courses: allCourses });
  } catch (err) {
    console.error("[institution-courses] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
