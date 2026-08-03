import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const { courseId, code } = await req.json();
    if (!courseId || !code) {
      return NextResponse.json({ error: "courseId e code são obrigatórios." }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    const courseSnap = await db.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) {
      return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
    }

    const course = courseSnap.data();
    if (!course?.accessCode) {
      return NextResponse.json({ error: "Este curso não requer código de acesso." }, { status: 400 });
    }

    if (course.accessCode.toUpperCase() !== code.trim().toUpperCase()) {
      return NextResponse.json({ error: "Código de acesso inválido." }, { status: 403 });
    }

    const userRef = db.collection("users").doc(uid);

    // Use arrayUnion instead of read-then-write to prevent race conditions
    await userRef.update({
      enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId),
    });

    return NextResponse.json({
      success: true,
      redirectUrl: `/dashboard/courses/${courseId}`,
    });
  } catch (err) {
    console.error("Erro ao verificar código:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
