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
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Verificar se a instituição existe e está aprovada
    const institutionRef = db.collection("institutions").doc(id);
    const institutionSnap = await institutionRef.get();
    if (!institutionSnap.exists) {
      return NextResponse.json({ error: "Instituição não encontrada." }, { status: 404 });
    }
    const institutionData = institutionSnap.data();
    if (institutionData?.status !== "approved") {
      return NextResponse.json({ error: "Instituição não está activa." }, { status: 400 });
    }

    // Verificar se o utilizador já pertence a uma instituição
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    if (userData?.institutionId) {
      if (userData.institutionId === id) {
        return NextResponse.json({ error: "Já pertences a esta instituição." }, { status: 400 });
      }
      return NextResponse.json({ error: "Já pertences a outra instituição." }, { status: 400 });
    }

    // Vincular o utilizador à instituição como student
    await userSnap.ref.update({
      institutionId: id,
      institutionRole: "student",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ message: "Bem-vindo à instituição!" });
  } catch (error) {
    console.error("Error joining institution:", error);
    return NextResponse.json({ error: "Erro ao entrar na instituição." }, { status: 500 });
  }
}