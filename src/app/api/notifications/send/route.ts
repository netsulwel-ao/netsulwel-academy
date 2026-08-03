import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";

function buildSaleConfirmedEmailHtml(data: {
  studentName: string;
  itemTitle: string;
  itemType: string;
  amount: number;
  siteUrl: string;
  dashboardUrl: string;
}): string {
  const { studentName, itemTitle, itemType, amount, siteUrl, dashboardUrl } = data;
  const noun = itemType === "live" ? "Aula ao Vivo" : itemType === "standalone" ? "Curso" : "Plano";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Pagamento Confirmado | Netsulwel Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:48px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${siteUrl}" style="text-decoration:none;color:#ffffff;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;">
              Netsulwel Academy
            </a>
          </td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background-color:#13131f;border:1px solid #1e1e30;border-radius:16px;">

            <!-- HEADER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#0a2e1a;padding:32px 20px;text-align:center;">
                  <div style="font-size:40px;margin-bottom:12px;">&#10003;</div>
                  <div style="font-size:11px;color:#4ade80;letter-spacing:2px;text-transform:uppercase;">Pagamento Confirmado</div>
                </td>
              </tr>
            </table>

            <!-- BODY -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 40px 32px;">
                  <h1 style="color:#ffffff;font-size:22px;font-weight:700;text-align:center;margin:0 0 14px 0;line-height:1.3;">
                    Ola, <span style="color:#4ade80;">${studentName}</span>!
                  </h1>

                  <p style="color:#7070a0;font-size:14px;line-height:1.75;text-align:center;margin:0 0 28px 0;">
                    O teu pagamento foi confirmado com sucesso.<br/>
                    Ja tens acesso ao teu <strong style="color:#a0a0c0;">${noun.toLowerCase()}</strong>.
                  </p>

                  <!-- DETALHES -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a16;border:1px solid #1a1a30;border-radius:8px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:20px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color:#4a4a6a;font-size:12px;padding-bottom:8px;">Item</td>
                            <td style="color:#ffffff;font-size:14px;font-weight:600;text-align:right;padding-bottom:8px;">${itemTitle}</td>
                          </tr>
                          <tr>
                            <td style="color:#4a4a6a;font-size:12px;padding-bottom:8px;">Tipo</td>
                            <td style="color:#a0a0c0;font-size:13px;text-align:right;padding-bottom:8px;">${noun}</td>
                          </tr>
                          <tr>
                            <td style="color:#4a4a6a;font-size:12px;border-top:1px solid #1a1a30;padding-top:8px;">Valor Pago</td>
                            <td style="color:#4ade80;font-size:16px;font-weight:700;text-align:right;border-top:1px solid #1a1a30;padding-top:8px;">${amount.toLocaleString("pt-AO")} Kz</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA -->
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td align="center" style="background-color:#16a34a;border-radius:8px;">
                        <a href="${dashboardUrl}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:inline-block;padding:14px 44px;letter-spacing:0.3px;">
                          Aceder ao Conteudo
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#3a3a5a;font-size:12px;line-height:1.6;text-align:center;margin:0;">
                    Se o botao nao funcionar, copia este link:<br/>
                    <a href="${dashboardUrl}" style="color:#7c3aed;font-size:11px;text-decoration:none;">${dashboardUrl}</a>
                  </p>
                </td>
              </tr>
            </table>

            <!-- FOOTER -->
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
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    // Only admins can send sale confirmation emails
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const userSnap = await db.collection("users").doc(uid).get();
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const { saleId, userId, itemTitle, itemType, amount } = await req.json();
    if (!saleId || !userId || !itemTitle || !amount) {
      return NextResponse.json({ error: "Campos obrigatórios em falta." }, { status: 400 });
    }

    // Fetch student email
    const studentSnap = await db.collection("users").doc(userId).get();
    if (!studentSnap.exists) {
      return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
    }
    const studentData = studentSnap.data()!;
    const studentEmail = studentData.email;
    const studentName = studentData.displayName || studentData.name || "Aluno";

    if (!studentEmail) {
      return NextResponse.json({ error: "Aluno sem email configurado." }, { status: 400 });
    }

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!smtpConfigured) {
      console.log("[Email] SMTP não configurado — email de confirmação ignorado para:", studentEmail);
      return NextResponse.json({ success: true, skipped: true, reason: "smtp_not_configured" });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;
    const siteUrl = origin || `https://${req.headers.get("host") || "academia.netsulwel.tech"}`;

    const dashboardUrl = itemType === "live"
      ? `${siteUrl}/dashboard/lives/${saleId}`
      : `${siteUrl}/dashboard/courses/${saleId}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: studentEmail,
      subject: `Pagamento Confirmado — ${itemTitle} | Netsulwel Academy`,
      html: buildSaleConfirmedEmailHtml({
        studentName,
        itemTitle,
        itemType: itemType || "standalone",
        amount,
        siteUrl,
        dashboardUrl,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Email] Erro ao enviar email de confirmação:", err);
    return NextResponse.json({ error: "Erro ao enviar email." }, { status: 500 });
  }
}
