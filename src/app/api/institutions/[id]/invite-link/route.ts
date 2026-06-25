import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import { randomBytes } from "crypto";

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
    const isAdminOrInstitutionAdmin = userData?.role === "admin" ||
      (userData?.institutionId === id && userData?.institutionRole === "admin");
    if (!isAdminOrInstitutionAdmin) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const role = body?.role === "teacher" ? "teacher" : "student";

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.collection("institutionInviteLinks").add({
      institutionId: id,
      token,
      role,
      status: "active",
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    });

    const link = `https://academia.netsulwel.tech/invite?token=${token}`;

    return NextResponse.json({ link, token, role, expiresAt });
  } catch (error) {
    console.error("Error creating invite link:", error);
    return NextResponse.json({ error: "Failed to create invite link" }, { status: 500 });
  }
}