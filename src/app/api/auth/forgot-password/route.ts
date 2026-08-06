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
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="text-align:center;">
                  <a href="${siteUrl}" style="text-decoration:none;color:#ffffff;display:inline-block;">
                    <!--[if !mso]><!-->
                    <svg width="36" height="36" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                      <g transform="translate(0,500) scale(0.1,-0.1)" fill="#ffffff">
                        <path d="M2320 4204 c-63 -24 -149 -57 -190 -73 -41 -16 -136 -53 -210 -81 -74 -28 -162 -62 -195 -75 -33 -13 -97 -38 -142 -55 -84 -33 -97 -43 -65 -53 9 -3 62 -23 117 -45 l100 -39 3 -79 c3 -91 -3 -124 -22 -124 -22 0 -26 -24 -26 -140 0 -120 5 -130 68 -130 52 0 62 24 62 142 0 92 -2 107 -20 123 -17 15 -20 31 -20 102 0 45 3 83 8 83 4 0 54 -18 112 -41 171 -67 334 -131 355 -139 11 -5 63 -25 115 -46 108 -42 102 -42 250 19 47 20 148 60 225 90 469 183 591 231 598 237 4 4 -5 12 -20 18 -15 5 -55 20 -88 32 -33 12 -87 32 -120 45 -33 13 -109 42 -170 65 -60 23 -148 56 -195 75 -47 18 -134 52 -195 75 -60 23 -120 46 -133 51 -41 16 -84 8 -202 -37z"/>
                        <path d="M1900 3526 l0 -136 565 0 565 0 0 135 c0 74 -2 135 -5 135 -2 0 -19 -7 -37 -14 -18 -8 -123 -49 -233 -91 -110 -42 -215 -82 -233 -90 -55 -25 -26 -33 -422 122 -63 25 -124 49 -135 53 -11 5 -30 12 -42 15 l-23 6 0 -135z"/>
                        <path d="M1555 3341 c-78 -19 -131 -70 -153 -147 -18 -62 -16 -1625 2 -1676 16 -45 52 -89 91 -113 43 -26 262 -32 1145 -31 728 1 735 1 781 22 50 23 89 69 108 123 8 24 11 266 11 850 0 772 -1 818 -19 856 -10 22 -29 50 -42 62 -57 52 -49 51 -862 57 -716 6 -758 5 -764 -11 -30 -85 -146 -95 -192 -17 -21 36 -41 40 -106 25z m885 -481 l0 -280 -78 0 -78 0 -100 104 c-119 122 -104 118 -371 109 l-173 -6 0 119 c1 145 13 178 80 212 43 22 52 22 382 22 l338 0 0 -280z m774 259 c65 -23 80 -60 85 -206 l3 -123 -220 0 -219 0 -104 -100 c-110 -107 -125 -114 -214 -108 l-50 3 -3 265 c-1 146 0 271 3 279 8 19 660 11 719 -10z m29 -379 l57 0 0 -180 0 -180 -307 2 -308 3 1 70 c0 82 10 125 26 125 7 0 44 34 84 74 44 46 85 79 106 85 19 6 85 9 158 6 69 -3 151 -5 183 -5z m-1099 -90 c47 -47 91 -86 96 -88 6 -2 10 -42 10 -93 l0 -89 -302 2 -303 3 -3 172 -2 172 127 4 c71 2 165 3 210 3 l82 -1 85 -85z m486 -285 l0 -165 -160 0 -160 0 0 165 0 165 160 0 160 0 0 -165z m-382 -117 l-5 -83 -94 -87 -94 -88 -207 0 -208 0 0 170 0 170 306 0 307 0 -5 -82z m1045 -84 c-1 -92 -4 -168 -5 -170 -2 -1 -94 -4 -205 -5 l-202 -2 -95 88 -96 88 0 84 0 83 303 0 302 0 -2 -166z m-884 -20 l31 -6 0 -274 0 -274 -343 0 c-392 0 -393 0 -434 80 -20 38 -23 60 -23 152 l0 108 218 0 219 0 74 81 c41 44 78 87 83 96 19 34 101 51 175 37z m351 -109 l105 -105 219 0 218 0 -4 -125 c-4 -139 -13 -162 -78 -197 -33 -17 -60 -18 -380 -16 l-345 3 -3 260 c-1 143 0 265 3 272 3 9 29 13 82 13 l78 0 105 -105z"/>
                      </g>
                    </svg>
                    <!--<![endif]-->
                    <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;vertical-align:middle;mso-line-height-rule:exactly;">Netsulwel Academy</span>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CARD PRINCIPAL -->
        <tr>
          <td style="background-color:#13131f;border:1px solid #1e1e30;border-radius:16px;">

            <!-- ILUSTRAÇÃO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background-color:#0a0a18;padding:36px 20px;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                    <tr>
                      <td style="font-size:28px;color:#7c3aed;line-height:1;padding-bottom:8px;text-align:center;">&#9679; &#9679; &#9679;</td>
                    </tr>
                    <tr>
                      <td style="font-size:11px;color:#7070a0;letter-spacing:2px;text-transform:uppercase;padding-bottom:16px;text-align:center;">Recupera&ccedil;&atilde;o de senha</td>
                    </tr>
                    <tr>
                      <td style="text-align:center;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#1a1530;border:1px solid #2e2060;width:280px;">
                          <tr>
                            <td style="background-color:#231b45;padding:8px 12px;text-align:left;font-size:0;">
                              <span style="display:inline-block;width:7px;height:7px;background-color:#3a1a6e;margin-right:5px;">&nbsp;</span>
                              <span style="display:inline-block;width:7px;height:7px;background-color:#3a1a6e;margin-right:5px;">&nbsp;</span>
                              <span style="display:inline-block;width:7px;height:7px;background-color:#4a2a8e;">&nbsp;</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px;text-align:center;">
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;width:60%;">
                                <tr><td style="background-color:#2a2050;height:5px;font-size:0;">&nbsp;</td></tr>
                              </table>
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 6px;width:80%;">
                                <tr><td style="background-color:#221a40;height:3px;font-size:0;">&nbsp;</td></tr>
                              </table>
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;width:70%;">
                                <tr><td style="background-color:#221a40;height:3px;font-size:0;">&nbsp;</td></tr>
                              </table>
                              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background-color:#7c3aed;">
                                <tr>
                                  <td style="padding:8px 20px;text-align:center;">
                                    <span style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;">REDEFINIR</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
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
      resetLink = await admin.auth().generatePasswordResetLink(email);
    } catch (fbErr: unknown) {
      const msg = fbErr instanceof Error ? fbErr.message : "";
      console.error("generatePasswordResetLink error:", msg);

      // Fallback: usar Firebase Auth REST API directamente
      if (msg.includes("INTERNAL ASSERT") || msg.includes("action link")) {
        try {
          const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
          if (!apiKey) throw new Error("API key não configurada");
          const restRes = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestType: "PASSWORD_RESET",
                email,
              }),
            }
          );
          const restData = await restRes.json();
          if (!restRes.ok) {
            const errCode = restData?.error?.message ?? "UNKNOWN";
            if (errCode === "EMAIL_NOT_FOUND") return NextResponse.json({ success: true });
            throw new Error(errCode);
          }
          // Firebase enviou o email directamente via REST — não precisamos do SMTP
          return NextResponse.json({ success: true });
        } catch (restErr) {
          const restMsg = restErr instanceof Error ? restErr.message : String(restErr);
          console.error("REST fallback error:", restMsg);
          return NextResponse.json({ error: "Erro ao enviar email de recuperação.", detail: restMsg }, { status: 500 });
        }
      }

      if (msg.includes("user-not-found") || msg.includes("EMAIL_NOT_FOUND")) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { error: "Erro ao gerar link de recuperação.", detail: msg },
        { status: 500 }
      );
    }

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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

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
