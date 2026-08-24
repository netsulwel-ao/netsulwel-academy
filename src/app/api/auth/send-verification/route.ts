import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

function buildVerificationEmailHtml(verifyUrl: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Verificação de email | Netsulwel Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:48px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${siteUrl}" style="text-decoration:none;color:#ffffff;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;">
              Netsulwel Academy
            </a>
          </td>
        </tr>
        <tr>
          <td style="background-color:#13131f;border:1px solid #1e1e30;border-radius:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#0a0a18;padding:36px 20px;text-align:center;">
                  <div style="font-size:28px;color:#7c3aed;line-height:1;padding-bottom:8px;">&#9993;</div>
                  <div style="font-size:11px;color:#7070a0;letter-spacing:2px;text-transform:uppercase;">Verificação de email</div>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 40px 32px;">
                  <h1 style="color:#ffffff;font-size:24px;font-weight:700;text-align:center;margin:0 0 14px 0;line-height:1.3;">
                    Confirme o seu<br/><span style="color:#a855f7;">email</span>
                  </h1>
                  <p style="color:#7070a0;font-size:14px;line-height:1.75;text-align:center;margin:0 0 28px 0;">
                    Bem-vindo à <strong style="color:#a0a0c0;">Netsulwel Academy</strong>!<br/>
                    Clica no botão abaixo para ativar a tua conta e começar a aprender.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td align="center" style="background-color:#7c3aed;border-radius:8px;">
                        <a href="${verifyUrl}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:inline-block;padding:14px 44px;letter-spacing:0.3px;">
                          Verificar email
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#3a3a5a;font-size:12px;line-height:1.6;text-align:center;margin:0 0 10px 0;">
                    Se o botão não funcionar, copia este link:
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#0a0a16;border:1px solid #1a1a30;border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:12px 16px;word-break:break-all;">
                        <a href="${verifyUrl}" style="color:#7c3aed;font-size:11px;text-decoration:none;line-height:1.6;">${verifyUrl}</a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#2e2e48;font-size:12px;line-height:1.7;text-align:center;margin:0;">
                    Este link expira em <strong style="color:#4a3a7a;">24 horas</strong>.<br/>
                    Se não criaste esta conta, ignora este email.
                  </p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #1a1a2a;padding:20px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:11px;color:#2a2a42;">&copy; ${new Date().getFullYear()} Netsulwel Academy</td>
                      <td style="text-align:right;font-size:11px;">
                        <a href="mailto:apoio@netsulwel.tech" style="color:#7c3aed;text-decoration:none;">apoio@netsulwel.tech</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="color:#1e1e30;font-size:11px;margin:0;">Netsulwel Academy &middot; Aprenda com quem faz acontecer.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }

    let admin;
    try {
      admin = getFirebaseAdmin();
    } catch (initErr) {
      console.error("[send-verification] Firebase Admin init error:", initErr);
      return NextResponse.json({ success: true, skipped: true, reason: "admin_init_error" });
    }

    const db = admin.firestore();

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured) {
      console.log("[send-verification] SMTP não configurado para:", email);
      return NextResponse.json({ success: true, skipped: true, reason: "smtp_not_configured" });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await db.collection("emailVerifications").add({
      email,
      token,
      createdAt: new Date(),
      expiresAt: new Date(expiresAt),
      used: false,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://academia.netsulwel.tech";
    const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${token}`;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Confirme o seu email — Netsulwel Academy",
        html: buildVerificationEmailHtml(verifyUrl, siteUrl),
      });

      console.log("[send-verification] Email enviado para:", email);
    } catch (smtpErr) {
      console.error("[send-verification] SMTP error:", smtpErr);
      return NextResponse.json({ success: true, skipped: true, reason: "smtp_error" });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-verification] Unexpected error:", err);
    return NextResponse.json({ success: true, skipped: true, reason: "unknown_error" });
  }
}
