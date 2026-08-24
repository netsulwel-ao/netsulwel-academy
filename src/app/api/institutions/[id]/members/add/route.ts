import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function POST(
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

    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !["teacher", "student"].includes(role)) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    // Check target user exists
    const targetSnap = await db.collection("users").doc(userId).get();
    if (!targetSnap.exists) {
      return NextResponse.json({ error: "Professor não encontrado." }, { status: 404 });
    }
    const targetData = targetSnap.data()!;

    // Check not already a member
    const existingSnap = await db
      .collection("institutionMembers")
      .where("institutionId", "==", id)
      .where("userId", "==", userId)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json({ error: "Já é membro desta instituição." }, { status: 409 });
    }

    // Add to institutionMembers collection
    await db.collection("institutionMembers").add({
      institutionId: id,
      userId,
      userName: targetData.name || "Sem nome",
      userEmail: targetData.email || "",
      userPhoto: targetData.photoURL || null,
      role,
      addedBy: uid,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "active",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[members/add] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
