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

    // Also include legacy users with institutionId on user doc
    const [membersSnap, legacyUsersSnap] = await Promise.all([
      db.collection("institutionMembers")
        .where("institutionId", "==", id)
        .where("status", "==", "active")
        .get(),
      db.collection("users")
        .where("institutionId", "==", id)
        .where("institutionRole", "in", ["teacher", "student"])
        .get(),
    ]);

    const seen = new Set<string>();
    const members: Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      photoURL?: string;
      role: string;
      addedAt: Date | null;
      source: "collection" | "legacy";
    }> = [];

    // New collection members
    for (const doc of membersSnap.docs) {
      const data = doc.data();
      seen.add(data.userId);
      members.push({
        id: doc.id,
        userId: data.userId,
        name: data.userName || "Sem nome",
        email: data.userEmail || "",
        photoURL: data.userPhoto,
        role: data.role || "student",
        addedAt: data.addedAt?.toDate?.() ?? null,
        source: "collection",
      });
    }

    // Legacy users (not in new collection)
    for (const doc of legacyUsersSnap.docs) {
      if (seen.has(doc.id)) continue;
      seen.add(doc.id);
      const data = doc.data();
      members.push({
        id: doc.id,
        userId: doc.id,
        name: data.name || "Sem nome",
        email: data.email || "",
        photoURL: data.photoURL,
        role: data.institutionRole || "student",
        addedAt: data.createdAt?.toDate?.() ?? null,
        source: "legacy",
      });
    }

    members.sort((a, b) => {
      if (!a.addedAt) return 1;
      if (!b.addedAt) return -1;
      return b.addedAt.getTime() - a.addedAt.getTime();
    });

    return NextResponse.json({ members });
  } catch (err) {
    console.error("[members] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
