import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateMap = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const timestamps = (rateMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, retryAfter };
  }
  timestamps.push(now);
  rateMap.set(ip, timestamps);
  return { allowed: true, retryAfter: 0 };
}

function buildResetEmailHtml(resetLink: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Recuperação de senha | Netsulwel Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:48px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">

        <!-- LOGO TOPO -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${siteUrl}" style="text-decoration:none;display:inline-flex;align-items:center;gap:10px;">
              <img src="${siteUrl}/Logo-Academy-White.svg" alt="Netsulwel Academy" height="36" style="display:block;border:0;" />
            </a>
          </td>
        </tr>

        <!-- CARD PRINCIPAL -->
        <tr>
          <td style="background-color:#13131f;border:1px solid #1e1e30;border-radius:16px;overflow:hidden;">

            <!-- ILUSTRAÇÃO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#0a0a18;padding:0;text-align:center;height:200px;position:relative;">
                  <div style="background-color:#0a0a18;padding:24px 0 0;text-align:center;">
                    <!--[if !mso]><!-->
                    <svg width="480" height="180" viewBox="0 0 480 180" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                      <ellipse cx="240" cy="220" rx="220" ry="140" fill="#130d2a"/>
                      <ellipse cx="240" cy="200" rx="150" ry="100" fill="#1a0f38"/>
                      <!-- monitor -->
                      <rect x="120" y="30" width="240" height="150" rx="10" fill="#1a1530" stroke="#2e2060" stroke-width="1.5"/>
                      <rect x="120" y="30" width="240" height="24" rx="10" fill="#231b45"/>
                      <rect x="120" y="42" width="240" height="12" fill="#231b45"/>
                      <circle cx="135" cy="42" r="4" fill="#3a1a6e"/>
                      <circle cx="149" cy="42" r="4" fill="#3a1a6e"/>
                      <circle cx="163" cy="42" r="4" fill="#4a2a8e"/>
                      <!-- conteudo tela -->
                      <rect x="138" y="66" width="90" height="7" rx="3" fill="#2a2050"/>
                      <rect x="138" y="80" width="130" height="5" rx="2.5" fill="#221a40"/>
                      <rect x="138" y="91" width="110" height="5" rx="2.5" fill="#221a40"/>
                      <rect x="138" y="106" width="75" height="26" rx="6" fill="#7c3aed"/>
                      <text x="175" y="123" font-size="9" fill="white" font-family="Arial,sans-serif" font-weight="700" text-anchor="middle">REDEFINIR</text>
                      <!-- cadeado -->
                      <rect x="275" y="78" width="58" height="44" rx="5" fill="#1e1840" stroke="#2e2060" stroke-width="1"/>
                      <circle cx="304" cy="93" r="8" fill="none" stroke="#7c3aed" stroke-width="2"/>
                      <rect x="300" y="98" width="8" height="16" rx="2" fill="#7c3aed"/>
                      <!-- personagem -->
                      <circle cx="348" cy="118" r="13" fill="#c084fc"/>
                      <path d="M335 178 L335 155 Q348 147 361 155 L361 178" fill="#7c3aed"/>
                      <rect x="330" y="176" width="36" height="4" rx="2" fill="#5a2aad"/>
                      <line x1="354" y1="160" x2="368" y2="144" stroke="#9d4ffa" stroke-width="2" stroke-linecap="round"/>
                      <circle cx="370" cy="142" r="4" fill="#7c3aed"/>
                      <!-- base -->
                      <path d="M130 178 L350 178" stroke="#1e1840" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.5"/>
                      <!-- partículas -->
                      <circle cx="75" cy="60" r="2" fill="#7c3aed" opacity="0.4"/>
                      <circle cx="415" cy="90" r="2" fill="#7c3aed" opacity="0.4"/>
                      <circle cx="90" cy="130" r="1.5" fill="#a855f7" opacity="0.3"/>
                      <circle cx="400" cy="50" r="1.5" fill="#a855f7" opacity="0.3"/>
                    </svg>
                    <!--<![endif]-->
                  </div>
                </td>
              </tr>
            </table>

            <!-- CORPO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 40px 32px;">

                  <h1 style="color:#ffffff;font-size:24px;font-weight:700;text-align:center;margin:0 0 14px 0;letter-spacing:-0.4px;line-height:1.3;">
                    Esqueceste a tua<br/><span style="color:#a855f7;">palavra-passe?</span>
                  </h1>

                  <p style="color:#7070a0;font-size:14px;line-height:1.75;text-align:center;margin:0 0 28px 0;">
                    Recebemos um pedido para redefinir a senha da tua conta na
                    <strong style="color:#a0a0c0;font-weight:500;">Netsulwel Academy</strong>.<br/>
                    Se não foste tu, ignora este email — a tua conta está segura.
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                    <tr><td style="height:1px;background-color:#1e1e30;"></td></tr>
                  </table>

                  <p style="color:#4a4a6a;font-size:12px;text-align:center;margin:0 0 16px 0;letter-spacing:0.3px;">
                    Se foste tu, clica no botão abaixo:
                  </p>

                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td align="center" style="background-color:#7c3aed;border-radius:8px;">
                        <a href="${resetLink}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:inline-block;padding:14px 44px;letter-spacing:0.3px;">
                          Redefinir palavra-passe
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
                        <a href="${resetLink}" style="color:#7c3aed;font-size:11px;text-decoration:none;line-height:1.6;">${resetLink}</a>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#2e2e48;font-size:12px;line-height:1.7;text-align:center;margin:0;">
                    Este link expira em <strong style="color:#4a3a7a;">1 hora</strong> por razões de segurança.<br/>
                    Se não pediste esta alteração, ignora este email.
                  </p>

                </td>
              </tr>
            </table>

            <!-- RODAPÉ DO CARD -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #1a1a2a;padding:20px 40px;display:table-cell;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:11px;color:#2a2a42;">© ${new Date().getFullYear()} Netsulwel Academy</td>
                      <td style="text-align:right;font-size:11px;">
                        <a href="mailto:apoio.sulfatur@netsulwel.tech" style="color:#7c3aed;text-decoration:none;">apoio@netsulwel.tech</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- TAGLINE -->
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="color:#1e1e30;font-size:11px;margin:0;letter-spacing:0.5px;">
              Netsulwel Academy · Aprenda com quem faz acontecer.
            </p>
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${retryAfter} segundos.` },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }

    const { getFirebaseAdmin } = await import("@/lib/firebase-admin");
    let admin;
    try {
      admin = getFirebaseAdmin();
    } catch (initErr) {
      const initMsg = initErr instanceof Error ? initErr.message : "erro desconhecido";
      console.error("Firebase Admin init error:", initErr);
      return NextResponse.json(
        { error: "Serviço de autenticação indisponível. Contacta o suporte.", detail: process.env.NODE_ENV === "development" ? initMsg : undefined },
        { status: 500 }
      );
    }

    let resetLink: string;
    try {
      resetLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://academia.netsulwel.tech"}/login`,
      });
    } catch (fbErr: unknown) {
      const msg = fbErr instanceof Error ? fbErr.message : "";
      console.error("generatePasswordResetLink error:", msg);
      if (msg.includes("EMAIL_NOT_FOUND") || msg.includes("user-not-found")) {
        // Não revelar se o email existe — resposta genérica
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "Erro ao gerar link de recuperação.", detail: msg },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;
    const siteUrl = origin || `https://${req.headers.get("host") || "academia.netsulwel.tech"}`;

    if (!smtpConfigured) {
      console.log("SMTP não configurado. Link de recuperação (apenas desenvolvimento):", resetLink);
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ success: true, devResetLink: resetLink });
      }
      return NextResponse.json(
        { error: "Serviço de email temporariamente indisponível. Contacte o administrador." },
        { status: 500 }
      );
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Redefine a tua palavra-passe — Netsulwel Academy",
      html: buildResetEmailHtml(resetLink, siteUrl),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Erro ao enviar email de recuperação.", detail: msg },
      { status: 500 }
    );
  }
}
