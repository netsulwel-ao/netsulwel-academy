import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { type NextRequest } from "next/server";

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { uid: null, error: "Token de autenticação não fornecido." };
  }

  const token = authHeader.slice(7);
  try {
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, error: null };
  } catch {
    return { uid: null, error: "Token inválido ou expirado." };
  }
}
