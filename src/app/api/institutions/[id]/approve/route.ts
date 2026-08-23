import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import { sendNotificationAdmin, getInstitutionApprovedGroupKey } from "@/lib/notifications-admin";

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

    // Verificar se o utilizador é admin
    const userSnap = await db.collection("users").doc(uid).get();
    const userRole = userSnap.data()?.role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem aprovar instituições." }, { status: 403 });
    }

    const docRef = db.collection("institutions").doc(id);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    await docRef.update({
      status: "approved",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Notificar o admin da instituição
    const institutionData = snapshot.data();
    if (institutionData?.adminId) {
      await db.collection("users").doc(institutionData.adminId).update({
        role: "institution",
        institutionId: id,
        institutionRole: "admin",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await sendNotificationAdmin({
        db,
        uid: institutionData.adminId,
        type: "institution_approved",
        title: "Instituição Aprovada",
        message: `A instituição "${institutionData.name}" foi aprovada com sucesso. Já podes gerir os teus membros.`,
        link: "/dashboard/institution",
        groupKey: getInstitutionApprovedGroupKey(id),
      });
    }
    
    const updatedSnapshot = await docRef.get();
    return NextResponse.json({ institution: { id: updatedSnapshot.id, ...updatedSnapshot.data() } });
  } catch (error) {
    console.error("Error approving institution:", error);
    return NextResponse.json({ error: "Failed to approve institution" }, { status: 500 });
  }
}
