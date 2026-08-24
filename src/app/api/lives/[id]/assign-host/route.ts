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
    const { liveId, hostUid, hostName } = body;

    if (!liveId || !hostUid) {
      return NextResponse.json({ error: "liveId e hostUid são obrigatórios." }, { status: 400 });
    }

    // Verify the host is a member of this institution
    const memberSnap = await db
      .collection("institutionMembers")
      .where("institutionId", "==", id)
      .where("userId", "==", hostUid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    const instUserSnap = await db.collection("users").doc(hostUid).get();
    const isLegacyMember = instUserSnap.exists &&
      instUserSnap.data()?.institutionId === id &&
      instUserSnap.data()?.institutionRole === "teacher";

    if (memberSnap.empty && !isLegacyMember) {
      return NextResponse.json({ error: "Professor não é membro desta instituição." }, { status: 400 });
    }

    // Update live
    await db.collection("lives").doc(liveId).update({
      hostUid,
      hostName: hostName || null,
      assignedInstitutionId: id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[assign-host] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
