import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * PayPal webhook endpoint — server-side safety net.
 * 
 * If a user closes the tab after PayPal capture but before our client-side
 * /api/purchases/create completes, the sale is never recorded. PayPal sends
 * a webhook notification for every completed payment, so this endpoint
 * catches those orphaned payments.
 *
 * Requires env vars:
 *   PAYPAL_WEBHOOK_ID  — from PayPal Developer Dashboard
 *   PAYPAL_CLIENT_ID   — for verifying webhook signatures
 *   PAYPAL_SECRET      — for verifying webhook signatures
 *
 * If env vars are not set, this endpoint returns 501 (not configured).
 */
export async function POST(req: NextRequest) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!webhookId || !clientId || !secret) {
    return NextResponse.json(
      { error: "PayPal webhook não configurado." },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();

    // Verify webhook signature with PayPal API
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
    const verificationRes = await fetch(
      "https://api-m.paypal.com/v1/notifications/verify-webhook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          auth_algo: req.headers.get("paypal-auth-algo"),
          cert_url: req.headers.get("paypal-cert-url"),
          actual_event: body,
          transmission_id: req.headers.get("paypal-transmission-id"),
          transmission_sig: req.headers.get("paypal-transmission-sig"),
          transmission_time: req.headers.get("paypal-transmission-time"),
          webhook_id: webhookId,
        }),
      }
    );

    const verification = await verificationRes.json();
    if (verification.verification_status !== "SUCCESS") {
      console.error("[PayPal Webhook] Signature verification failed:", verification);
      return NextResponse.json(
        { error: "Verificação de webhook falhou." },
        { status: 403 }
      );
    }

    // Process PAYMENT.CAPTURE.COMPLETED events
    const eventType = body?.event_type;
    if (eventType !== "PAYMENT.CAPTURE.COMPLETED") {
      return NextResponse.json({ received: true, skipped: true });
    }

    const resourceId = body?.resource?.id; // PayPal order/capture ID
    if (!resourceId) {
      return NextResponse.json({ error: "Missing resource ID" }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Find the matching pending sale
    const pendingSales = await db.collection("sales")
      .where("paypalTransactionId", "==", resourceId)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (pendingSales.empty) {
      // Either already confirmed or sale doesn't exist (user completed client flow)
      return NextResponse.json({ received: true, no_action: true });
    }

    const saleDoc = pendingSales.docs[0];
    const sale = saleDoc.data();

    // Calculate fees
    const feePercentage = sale.feePercentage ?? 0;
    const fee = Math.round(sale.amount * feePercentage / 100);
    const netAmount = sale.amount - fee;

    // Confirm the sale
    await saleDoc.ref.update({
      status: "confirmed",
      fee,
      netAmount,
      updatedAt: new Date().toISOString(),
    });

    // Grant access server-side
    const userRef = db.collection("users").doc(sale.userId);

    if (sale.type === "standalone" && sale.itemId) {
      await userRef.update({
        enrolledCourses: admin.firestore.FieldValue.arrayUnion(sale.itemId),
      });

      // Se já existe chat de grupo para este curso, adicionar o aluno como participante
      const groupChatId = `course_${sale.itemId}`;
      const chatRef = db.collection("courseChats").doc(groupChatId);
      const chatSnap = await chatRef.get();
      if (chatSnap.exists) {
        const chatData = chatSnap.data()!;
        if (!chatData.participants?.includes(sale.userId)) {
          // Buscar dados do aluno para o nome
          const userSnap = await db.collection("users").doc(sale.userId).get();
          const uData = userSnap.data();
          const studentName = uData?.displayName || uData?.name || sale.userName || "Aluno";
          const chatUpdate: Record<string, unknown> = {
            participants: admin.firestore.FieldValue.arrayUnion(sale.userId),
            [`participantNames.${sale.userId}`]: studentName,
          };
          if (uData?.photoURL) {
            chatUpdate[`participantPhotos.${sale.userId}`] = uData.photoURL;
          }
          await chatRef.update(chatUpdate);
        }
      }
    } else if (sale.type === "live" && sale.itemId) {
      await userRef.update({
        enrolledLives: admin.firestore.FieldValue.arrayUnion(sale.itemId),
      });
    } else if (sale.type === "smart" || sale.type === "golden") {
      await userRef.update({ plan: sale.type });
    }

    console.log("[PayPal Webhook] Sale confirmed via webhook:", saleDoc.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[PayPal Webhook] Error:", err);
    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}
