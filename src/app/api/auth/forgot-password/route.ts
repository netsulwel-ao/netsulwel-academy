import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }

    // 1. Gerar link de redefinição via Firebase Admin SDK
    const { getFirebaseAdmin } = await import("@/lib/firebase-admin");
    const admin = getFirebaseAdmin();
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // 2. Configurar transporte SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3. Enviar email estilizado
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Recuperação de senha — Netsulwel Academy",
      html: `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperação de senha</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 32px;text-align:center;">
              <img src="https://netsulwel-academy.firebasestorage.app/o/Logo-Academy-White.svg?alt=media" alt="Netsulwel Academy" style="height:48px;margin-bottom:8px;" />
              <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:16px 0 0 0;">Recuperação de senha</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">Olá,</p>
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Recebemos um pedido de redefinição de senha para a sua conta na <strong>Netsulwel Academy</strong>.
              </p>
              <p style="color:#333333;font-size:16px;line-height:1.6;margin:0 0 24px 0;">
                Clique no botão abaixo para criar uma nova palavra-passe:
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto;">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#7c3aed,#a855f7);border-radius:8px;padding:14px 40px;">
                    <a href="${resetLink}" target="_blank" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">
                      Redefinir palavra-passe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#999999;font-size:14px;line-height:1.6;margin:24px 0 0 0;">
                Se não foi você quem pediu esta redefinição, ignore este email.
              </p>
              <hr style="border:none;border-top:1px solid #e0e0e0;margin:32px 0;" />
              <p style="color:#999999;font-size:13px;line-height:1.5;margin:0;">
                Este link expira em <strong>1 hora</strong> por motivos de segurança.<br />
                Netsulwel Academy — Aprenda com quem faz acontecer.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;text-align:center;border-top:1px solid #e0e0e0;">
              <p style="color:#999999;font-size:12px;margin:0 0 8px 0;">
                © ${new Date().getFullYear()} Netsulwel Academy. Todos os direitos reservados.
              </p>
              <p style="color:#999999;font-size:12px;margin:0;">
                Se tiver dúvidas, contacte-nos: <a href="mailto:apoio.sulfatur@netsulwel.tech" style="color:#7c3aed;text-decoration:none;">apoio.sulfatur@netsulwel.tech</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Erro ao enviar email de recuperação." },
      { status: 500 }
    );
  }
}
