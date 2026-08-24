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
    const isInstAdmin = userData?.institutionId === id && userData?.institutionRole === "admin";
    const isGlobalAdmin = userData?.role === "admin";
    if (!isInstAdmin && !isGlobalAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ professors: [] });
    }

    const qLower = q.toLowerCase();

    // Get existing member userIds to exclude
    const membersSnap = await db
      .collection("institutionMembers")
      .where("institutionId", "==", id)
      .where("status", "==", "active")
      .get();
    const existingUserIds = new Set(membersSnap.docs.map(d => d.data().userId));

    // Also exclude legacy members
    const legacySnap = await db
      .collection("users")
      .where("institutionId", "==", id)
      .where("institutionRole", "in", ["teacher", "student"])
      .get();
    legacySnap.docs.forEach(d => existingUserIds.add(d.id));

    // Fetch all teachers and filter in-memory (suitable for expected scale)
    const teachersSnap = await db
      .collection("users")
      .where("role", "==", "teacher")
      .limit(500)
      .get();

    const professors: Array<{
      uid: string;
      name: string;
      email: string;
      photoURL?: string;
      alreadyMember: boolean;
    }> = [];

    for (const doc of teachersSnap.docs) {
      if (existingUserIds.has(doc.id)) continue;
      const data = doc.data();
      const name = (data.name || "").toLowerCase();
      const email = (data.email || "").toLowerCase();
      if (name.includes(qLower) || email.includes(qLower)) {
        professors.push({
          uid: doc.id,
          name: data.name || "Sem nome",
          email: data.email || "",
          photoURL: data.photoURL,
          alreadyMember: false,
        });
      }
    }

    professors.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ professors: professors.slice(0, 20) });
  } catch (err) {
    console.error("[search-professors] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
