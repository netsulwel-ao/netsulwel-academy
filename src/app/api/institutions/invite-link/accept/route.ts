import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token é obrigatório." }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const snap = await db.collection("institutionInviteLinks")
      .where("token", "==", token)
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
    }

    const linkDoc = snap.docs[0];
    const linkData = linkDoc.data();

    if (new Date(linkData.expiresAt.toDate()) < new Date()) {
      await linkDoc.ref.update({ status: "expired" });
      return NextResponse.json({ error: "Link expirado." }, { status: 400 });
    }

    const instSnap = await db.collection("institutions").doc(linkData.institutionId).get();
    if (!instSnap.exists) {
      return NextResponse.json({ error: "Instituição não encontrada." }, { status: 404 });
    }

    const institution = instSnap.data();

    return NextResponse.json({
      token,
      institutionId: linkData.institutionId,
      institution: { id: instSnap.id, name: institution?.name, email: institution?.email },
    });
  } catch (error) {
    console.error("Error validating invite link:", error);
    return NextResponse.json({ error: "Failed to validate invite link" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const body = await req.json();
    const { token, userId } = body;
    if (!token || !userId) {
      return NextResponse.json({ error: "Token e userId são obrigatórios." }, { status: 400 });
    }

    if (authResult.uid !== userId) {
      return NextResponse.json({ error: "userId não corresponde ao utilizador autenticado." }, { status: 403 });
    }

    const snap = await db.collection("institutionInviteLinks")
      .where("token", "==", token)
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 404 });
    }

    const linkDoc = snap.docs[0];
    const linkData = linkDoc.data();

    if (new Date(linkData.expiresAt.toDate()) < new Date()) {
      await linkDoc.ref.update({ status: "expired" });
      return NextResponse.json({ error: "Link expirado." }, { status: 400 });
    }

    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    const userData = userSnap.data();
    if (userData?.institutionId) {
      return NextResponse.json({ error: "Já pertences a uma instituição." }, { status: 400 });
    }

    await userSnap.ref.update({
      institutionId: linkData.institutionId,
      institutionRole: "student",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await linkDoc.ref.update({ status: "accepted", acceptedBy: userId });

    return NextResponse.json({ message: "Bem-vindo à instituição!" });
  } catch (error) {
    console.error("Error accepting invite link:", error);
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }
}