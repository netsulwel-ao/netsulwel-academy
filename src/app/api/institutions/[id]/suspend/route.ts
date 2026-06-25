import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Apenas administradores podem suspender instituições
    const { uid, error } = await verifyAuth(req);
    if (error || !uid) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const userSnap = await db.collection("users").doc(uid).get();
    const userRole = userSnap.data()?.role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem suspender instituições." }, { status: 403 });
    }

    const docRef = db.collection("institutions").doc(id);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    await docRef.update({
      status: "suspended",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const updatedSnapshot = await docRef.get();
    return NextResponse.json({ institution: { id: updatedSnapshot.id, ...updatedSnapshot.data() } });
  } catch (error) {
    console.error("Error suspending institution:", error);
    return NextResponse.json({ error: "Failed to suspend institution" }, { status: 500 });
  }
}
