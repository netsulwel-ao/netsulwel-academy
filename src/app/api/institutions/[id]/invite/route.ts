import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";

function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

function buildInvitationEmailHtml(
  institutionName: string,
  inviterName: string,
  role: string,
  acceptLink: string,
  siteUrl: string
): string {
  const roleText = role === "teacher" ? "Professor" : "Aluno";
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Convite para ${institutionName} | Netsulwel Academy</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d14;padding:48px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;">
        <!-- LOGO -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${siteUrl}" style="text-decoration:none;color:#ffffff;display:inline-block;">
              <span style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#ffffff;">Netsulwel Academy</span>
            </a>
          </td>
        </tr>
        <!-- CARD -->
        <tr>
          <td style="background-color:#13131f;border:1px solid #1e1e30;border-radius:16px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:36px 40px 32px;">
                  <h1 style="color:#ffffff;font-size:24px;font-weight:700;text-align:center;margin:0 0 14px 0;">
                    Convite para <span style="color:#a855f7;">${institutionName}</span>
                  </h1>
                  <p style="color:#7070a0;font-size:14px;line-height:1.75;text-align:center;margin:0 0 28px 0;">
                    <strong style="color:#a0a0c0;font-weight:500;">${inviterName}</strong> convidou-te para te juntares à <strong style="color:#a0a0c0;font-weight:500;">${institutionName}</strong> como <strong style="color:#a855f7;">${roleText}</strong>.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
                    <tr><td style="height:1px;background-color:#1e1e30;"></td></tr>
                  </table>
                  <p style="color:#4a4a6a;font-size:12px;text-align:center;margin:0 0 16px 0;">
                    Para aceitar o convite, clica no botão abaixo:
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                    <tr>
                      <td align="center" style="background-color:#7c3aed;border-radius:8px;">
                        <a href="${acceptLink}" target="_blank" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:inline-block;padding:14px 44px;">
                          Aceitar Convite
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#3a3a5a;font-size:12px;line-height:1.7;text-align:center;margin:0;">
                    Este link expira em <strong style="color:#4a3a7a;">7 dias</strong> por razões de segurança.<br/>
                    Se não pediste este convite, ignora este email.
                  </p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-top:1px solid #1a1a2a;padding:20px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:11px;color:#2a2a42;">© ${new Date().getFullYear()} Netsulwel Academy</td>
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
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { uid, error } = await verifyAuth(req);
    if (error || !uid) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Verificar se o utilizador é admin global ou admin da instituição
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    const isAdminOrInstitutionAdmin = userData?.role === "admin" || 
      (userData?.institutionId === id && userData?.institutionRole === "admin");
    if (!isAdminOrInstitutionAdmin) {
      return NextResponse.json({ error: "Sem permissão para convidar membros." }, { status: 403 });
    }
    
    const body = await req.json();
    const { email, role, invitedBy, inviterName } = body;
    
    if (!email || !role || !invitedBy || !inviterName) {
      return NextResponse.json({ error: "Email, role, invitedBy, and inviterName are required" }, { status: 400 });
    }
    
    if (!["teacher", "student"].includes(role)) {
      return NextResponse.json({ error: "Role must be 'teacher' or 'student'" }, { status: 400 });
    }
    
    // Check if institution exists and is approved
    const institutionRef = db.collection("institutions").doc(id);
    const institutionSnapshot = await institutionRef.get();
    
    if (!institutionSnapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    const institutionData = institutionSnapshot.data();
    if (institutionData?.status !== "approved") {
      return NextResponse.json({ error: "Institution must be approved to send invitations" }, { status: 400 });
    }
    
    // Check if user already exists with this email
    const usersSnapshot = await db.collection("users").where("email", "==", email).get();
    if (!usersSnapshot.empty) {
      const user = usersSnapshot.docs[0].data();
      if (user.institutionId === id) {
        return NextResponse.json({ error: "User is already a member of this institution" }, { status: 400 });
      }
    }
    
    // Check if there's already a pending invitation
    const existingInvitations = await db.collection("institutionInvitations")
      .where("institutionId", "==", id)
      .where("email", "==", email)
      .where("status", "==", "pending")
      .get();
    
    if (!existingInvitations.empty) {
      return NextResponse.json({ error: "A pending invitation already exists for this email" }, { status: 400 });
    }
    
    // Generate token and expiration (7 days)
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Create invitation
    const invitationData = {
      institutionId: id,
      email,
      role,
      status: "pending",
      token,
      invitedBy,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const invitationRef = await db.collection("institutionInvitations").add(invitationData);
    
    // Send email
    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    if (smtpConfigured) {
      const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;
      const siteUrl = origin || `https://${req.headers.get("host") || "academia.netsulwel.tech"}`;
      const acceptLink = `${siteUrl}/institution/invite/accept?token=${token}`;
      
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
        subject: `Convite para ${institutionData?.name} — Netsulwel Academy`,
        html: buildInvitationEmailHtml(
          institutionData?.name || "a instituição",
          inviterName,
          role,
          acceptLink,
          siteUrl
        ),
      });
    } else if (process.env.NODE_ENV === "development") {
      console.log("SMTP não configurado. Link de aceitação (apenas desenvolvimento):", `${process.env.NEXT_PUBLIC_SITE_URL}/institution/invite/accept?token=${token}`);
    }
    
    return NextResponse.json({ 
      invitation: { id: invitationRef.id, ...invitationData },
      message: smtpConfigured ? "Invitation sent successfully" : "Invitation created (email not sent in development)"
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
