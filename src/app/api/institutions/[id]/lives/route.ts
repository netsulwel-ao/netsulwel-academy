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

    const snap = await db
      .collection("lives")
      .where("institutionId", "==", id)
      .get();

    const lives = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }));
    lives.sort((a, b) => {
      const aTime = a.scheduledAt ? new Date(a.scheduledAt as string).getTime() : 0;
      const bTime = b.scheduledAt ? new Date(b.scheduledAt as string).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ lives });
  } catch (err) {
    console.error("[institution-lives] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

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
    const { title, description, thumbnail, scheduledAt, target, price, hostUid, hostName } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Título e data são obrigatórios." }, { status: 400 });
    }

    const roomName = `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const liveData = {
      title,
      description: description || "",
      thumbnail: thumbnail || "",
      scheduledAt,
      target: target || "standalone",
      price: target === "standalone" ? Number(price) || 0 : null,
      status: "scheduled",
      createdBy: uid,
      institutionId: id,
      assignedInstitutionId: id,
      hostUid: hostUid || uid,
      hostName: hostName || userData?.name || "Instituição",
      roomName,
      participantCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("lives").add(liveData);

    return NextResponse.json({ success: true, liveId: docRef.id });
  } catch (err) {
    console.error("[institution-lives/create] Error:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
