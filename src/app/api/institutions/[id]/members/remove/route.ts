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
    const { memberId, source } = body;

    if (!memberId) {
      return NextResponse.json({ error: " memberId é obrigatório." }, { status: 400 });
    }

    if (source === "legacy") {
      // Remove from user doc
      await db.collection("users").doc(memberId).update({
        institutionId: null,
        institutionRole: null,
      });
    } else {
      // Soft-delete from institutionMembers
      await db.collection("institutionMembers").doc(memberId).update({
        status: "inactive",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[members/remove] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
