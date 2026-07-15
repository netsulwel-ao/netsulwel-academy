import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import type { PrivateAccessLink, AccessLog } from "@/types/access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const uid = request.headers.get("X-User-ID") || "";
    const authHeader = request.headers.get("Authorization");

    // Validar token
    if (!token || token.length < 10) {
      return NextResponse.json(
        { error: "Link inválido ou expirado" },
        { status: 400 }
      );
    }

    // Use Admin SDK instead of client SDK
    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Buscar link privado
    const linksRef = db.collection("private_access_links");
    const q = linksRef.where("token", "==", token);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Link não encontrado ou expirado" },
        { status: 404 }
      );
    }

    const linkDoc = snapshot.docs[0];
    const link = { id: linkDoc.id, ...linkDoc.data() } as PrivateAccessLink;

    // Verificações de validade
    if (link.status !== "active") {
      return NextResponse.json(
        { error: "Link foi revogado ou expirou" },
        { status: 403 }
      );
    }

    // Comparação correta de timestamps (ambos ISO strings)
    if (link.expiresAt) {
      const expiresAtMs = typeof link.expiresAt === 'number' 
        ? link.expiresAt 
        : new Date(link.expiresAt as string).getTime();
      const nowMs = Date.now();
      if (expiresAtMs < nowMs) {
        await db.collection("private_access_links").doc(link.id!).update({
          status: "expired",
        });
        return NextResponse.json(
          { error: "Link expirou" },
          { status: 403 }
        );
      }
    }

    if (link.maxUses && link.usedCount >= link.maxUses) {
      return NextResponse.json(
        { error: "Link atingiu o número máximo de usos" },
        { status: 403 }
      );
    }

    // Determinar redirectTo URL
    // O aluno vai para /dashboard/lives/[id] para ver a live
    // O studio /lives/[id]/studio é apenas para o professor
    const redirectTo = link.liveId
      ? `/dashboard/lives/${link.liveId}`
      : `/dashboard/courses/${link.courseId}`;

    console.log("[API] Link data:", {
      linkId: link.id,
      liveId: link.liveId,
      courseId: link.courseId,
      computedRedirectTo: redirectTo,
    });

    // Se solicitação é GET sem uid, retornar dados do link com redirectTo
    if (!uid) {
      return NextResponse.json({
        courseId: link.courseId,
        liveId: link.liveId,
        valid: true,
        redirectTo,
        loginUrl: `/login?redirect=/access/${token}`,
      });
    }

    // Se user está autenticado, conceder acesso e atualizar o link
    const updatedUsedBy = [...(link.usedBy || [])];
    if (!updatedUsedBy.includes(uid)) {
      updatedUsedBy.push(uid);
    }

    await db.collection("private_access_links").doc(link.id!).update({
      usedCount: (link.usedCount || 0) + 1,
      usedBy: updatedUsedBy,
      lastAccessedAt: new Date().toISOString(),
    });

    // Conceder acesso ao usuário
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const updateData: Record<string, any> = {};

    // Adicionar aos cursos ou lives do usuário
    if (link.courseId) {
      const enrolledCourses = userData?.enrolledCourses || [];
      if (!enrolledCourses.includes(link.courseId)) {
        updateData.enrolledCourses = [...enrolledCourses, link.courseId];
      }
    }

    if (link.liveId) {
      const enrolledLives = userData?.enrolledLives || [];
      if (!enrolledLives.includes(link.liveId)) {
        updateData.enrolledLives = [...enrolledLives, link.liveId];
      }
    }
    if (Object.keys(updateData).length > 0) {
      await userRef.update(updateData);
    }

    // Registrar acesso
    const accessLog: Record<string, any> = {
      userId: uid,
      linkToken: token,
      grantedAt: Date.now(),
      accessType: link.courseId ? "course" : "live",
    };
    
    if (link.courseId) {
      accessLog.courseId = link.courseId;
    }
    if (link.liveId) {
      accessLog.liveId = link.liveId;
    }

    await db.collection("access_logs").add(accessLog);

    console.log("[API] Access granted via private link:", {
      token: token.substring(0, 10) + "...",
      userId: uid,
      liveId: link.liveId,
      courseId: link.courseId,
      redirectTo,
    });

    return NextResponse.json({
      success: true,
      message: "Acesso concedido com sucesso",
      courseId: link.courseId ?? null,
      liveId: link.liveId ?? null,
      redirectTo,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || "unknown";
    console.error("[API ERROR] Failed to process private link:", errorMsg, errorCode);
    return NextResponse.json(
      { error: `Erro ao processar link: ${errorMsg}`, code: errorCode },
      { status: 500 }
    );
  }
}
