import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, query, where, getDocs } from "firebase/firestore";
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

    // Buscar link privado
    const linksRef = collection(db, "private_access_links");
    const q = query(linksRef, where("token", "==", token));
    const snapshot = await getDocs(q);

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

    if (link.expiresAt && link.expiresAt < Date.now()) {
      await updateDoc(doc(db, "private_access_links", link.id!), {
        status: "expired",
      });
      return NextResponse.json(
        { error: "Link expirou" },
        { status: 403 }
      );
    }

    if (link.maxUses && link.usedCount >= link.maxUses) {
      return NextResponse.json(
        { error: "Link atingiu o número máximo de usos" },
        { status: 403 }
      );
    }

    // Se solicitação é GET apenas, retornar dados do link
    if (request.method === "GET" && !uid) {
      return NextResponse.json({
        courseId: link.courseId,
        liveId: link.liveId,
        valid: true,
      });
    }

    // Se user está autenticado, conceder acesso
    if (!uid) {
      // Redirecionar para login com intent de usar o link
      return NextResponse.json(
        {
          error: "Authentication required",
          loginUrl: `/login?redirect=/access/${token}`,
        },
        { status: 401 }
      );
    }

    // Atualizar link: incrementar usedCount, adicionar usuário
    const updatedUsedBy = [...(link.usedBy || [])];
    if (!updatedUsedBy.includes(uid)) {
      updatedUsedBy.push(uid);
    }

    await updateDoc(doc(db, "private_access_links", link.id!), {
      usedCount: (link.usedCount || 0) + 1,
      usedBy: updatedUsedBy,
    });

    // Conceder acesso ao usuário
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const updateData: Record<string, any> = {};

    // Adicionar aos cursos ou lives do usuário
    if (link.courseId) {
      const enrolledCourses = userData.enrolledCourses || [];
      if (!enrolledCourses.includes(link.courseId)) {
        updateData.enrolledCourses = [...enrolledCourses, link.courseId];
      }
    }

    if (link.liveId) {
      const enrolledLives = userData.enrolledLives || [];
      if (!enrolledLives.includes(link.liveId)) {
        updateData.enrolledLives = [...enrolledLives, link.liveId];
      }
    }

    if (Object.keys(updateData).length > 0) {
      await updateDoc(userRef, updateData);
    }

    // Registrar acesso
    const accessLog: Omit<AccessLog, "id"> = {
      userId: uid,
      linkToken: token,
      courseId: link.courseId,
      liveId: link.liveId,
      grantedAt: Date.now(),
      accessType: link.courseId ? "course" : "live",
    };

    await addDoc(collection(db, "access_logs"), accessLog);

    return NextResponse.json({
      success: true,
      message: "Acesso concedido com sucesso",
      courseId: link.courseId,
      liveId: link.liveId,
      redirectTo: link.courseId
        ? `/dashboard/courses/${link.courseId}`
        : `/dashboard/lives/${link.liveId}`,
    });
  } catch (error) {
    console.error("Erro ao processar link privado:", error);
    return NextResponse.json(
      { error: "Erro ao processar link" },
      { status: 500 }
    );
  }
}
