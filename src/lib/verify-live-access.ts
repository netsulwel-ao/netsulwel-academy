import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { type NextRequest } from "next/server";

interface LiveAccessResult {
  uid: string;
  isOwner: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  liveData: Record<string, any>;
  error?: string;
}

/**
 * Verifies the user is authenticated AND has access to the specific live.
 * Returns user info + live data, or throws a NextResponse error.
 */
export async function verifyLiveAccess(
  request: NextRequest,
  liveId: string
): Promise<LiveAccessResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Token de autenticação não fornecido." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const admin = getFirebaseAdmin();
  const db = admin.firestore();

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token);
  } catch {
    throw new Response(JSON.stringify({ error: "Token inválido ou expirado." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uid = decoded.uid;

  // Get live document
  const liveSnap = await db.doc(`lives/${liveId}`).get();
  if (!liveSnap.exists) {
    throw new Response(JSON.stringify({ error: "Live não encontrada." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const liveData = liveSnap.data()!;
  const isOwner = liveData.createdBy === uid;

  // Get user role
  const userSnap = await db.doc(`users/${uid}`).get();
  const userData = userSnap.data();
  const role = userData?.role ?? "aluno";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  // Access check: owner, admin, or has enrollment (for paid lives)
  if (!isOwner && !isAdmin) {
    const isFree = liveData.target === "free";

    if (!isFree) {
      // Check enrollment
      const isEnrolled = userData?.enrolledLives?.[liveId] === true;
      if (!isEnrolled) {
        throw new Response(
          JSON.stringify({ error: "Não tens acesso a esta live. Precisa de estar inscrito." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  return { uid, isOwner, isAdmin, isTeacher, liveData };
}
