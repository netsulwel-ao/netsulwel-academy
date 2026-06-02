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
    smtp_host: process.env.SMTP_HOST ?? "N/A",
    smtp_user: process.env.SMTP_USER ?? "N/A",
    has_smtp_pass: !!process.env.SMTP_PASS,
    site_url: process.env.NEXT_PUBLIC_SITE_URL ?? "N/A",
  };

  try {
    const { getFirebaseAdmin } = await import("@/lib/firebase-admin");
    const admin = getFirebaseAdmin();
    info.admin_init = "OK";
    info.apps_count = admin.apps.length;

    // Testar generatePasswordResetLink sem continueUrl
    try {
      await admin.auth().generatePasswordResetLink("test-nonexistent@netsulwel.tech");
      info.reset_link_test = "OK";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("user-not-found") || msg.includes("EMAIL_NOT_FOUND")) {
        info.reset_link_test = "OK (email não existe — esperado)";
      } else {
        info.reset_link_test = "ERRO: " + msg;
      }
    }
  } catch (e) {
    info.admin_init = "ERRO";
    info.admin_error = e instanceof Error ? e.message : String(e);
  }

  // Testar SMTP
  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.verify();
    info.smtp_test = "OK";
  } catch (e) {
    info.smtp_test = "ERRO: " + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json(info);
}
