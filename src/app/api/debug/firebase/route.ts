import { NextResponse } from "next/server";

// ROTA TEMPORÁRIA DE DIAGNÓSTICO — remover após resolver o problema
// Aceder: https://academia.netsulwel.tech/api/debug/firebase
export async function GET() {
  const info: Record<string, unknown> = {
    node_env: process.env.NODE_ENV,
    has_b64: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    b64_length: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length ?? 0,
    has_project_id: !!process.env.FIREBASE_PROJECT_ID,
    has_client_email: !!process.env.FIREBASE_CLIENT_EMAIL,
    has_private_key: !!process.env.FIREBASE_PRIVATE_KEY,
    private_key_starts: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) ?? "N/A",
  };

  try {
    const { getFirebaseAdmin } = await import("@/lib/firebase-admin");
    const admin = getFirebaseAdmin();
    info.admin_init = "OK";
    info.apps_count = admin.apps.length;
  } catch (e) {
    info.admin_init = "ERRO";
    info.admin_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info);
}
