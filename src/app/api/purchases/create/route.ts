import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

interface PurchaseBody {
  type: "standalone" | "smart" | "golden" | "live";
  itemId?: string;
  paymentMethod: string;
  receiptUrl?: string;
  paypalTransactionId?: string;
  idempotencyKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return NextResponse.json({ error }, { status: 401 });

    const body: PurchaseBody = await req.json();
    const { type, itemId, paymentMethod, receiptUrl, paypalTransactionId, idempotencyKey } = body;

    if (!type || !paymentMethod) {
      return NextResponse.json({ error: "type e paymentMethod são obrigatórios." }, { status: 400 });
    }

    if (type === "standalone" && !itemId) {
      return NextResponse.json({ error: "itemId é obrigatório para cursos avulsos." }, { status: 400 });
    }

    if (type === "live" && !itemId) {
      return NextResponse.json({ error: "itemId é obrigatório para aulas avulsas." }, { status: 400 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();

    // Idempotency check — prevent duplicate purchases
    if (idempotencyKey) {
      const existing = await db.collection("sales")
        .where("idempotencyKey", "==", idempotencyKey)
        .limit(1)
        .get();
      if (!existing.empty) {
        const existingSale = existing.docs[0].data();
        return NextResponse.json({
          success: true,
          saleId: existing.docs[0].id,
          status: existingSale.status,
          duplicate: true,
        });
      }
    }

    // Server-side price validation — never trust the client
    let amount = 0;
    let itemTitle = "";
    let sellerId: string | undefined;
    let sellerName: string | undefined;
    let sellerType: "teacher" | "institution" | undefined;
    let feePercentage: number | undefined;

    if (type === "standalone" && itemId) {
      const courseSnap = await db.collection("courses").doc(itemId).get();
      if (!courseSnap.exists) {
        return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
      }
      const course = courseSnap.data()!;
      amount = course.price ?? 0;
      itemTitle = course.title;
      sellerId = course.sellerId || course.createdBy;
      feePercentage = course.feePercentage;
    } else if (type === "live" && itemId) {
      const liveSnap = await db.collection("lives").doc(itemId).get();
      if (!liveSnap.exists) {
        return NextResponse.json({ error: "Aula ao vivo não encontrada." }, { status: 404 });
      }
      const live = liveSnap.data()!;
      amount = live.price ?? 0;
      itemTitle = live.title;
      sellerId = live.createdBy;
      feePercentage = live.feePercentage;
    } else if (type === "smart" || type === "golden") {
      const settingsSnap = await db.collection("settings").doc("platform").get();
      if (!settingsSnap.exists) {
        return NextResponse.json({ error: "Configurações da plataforma não encontradas." }, { status: 500 });
      }
      const settings = settingsSnap.data()!;
      amount = settings.plans?.[type]?.price ?? 0;
      itemTitle = settings.plans?.[type]?.label || type;
    }

    // Fetch seller name if we have a sellerId
    if (sellerId) {
      const sellerSnap = await db.collection("users").doc(sellerId).get();
      if (sellerSnap.exists) {
        const sd = sellerSnap.data()!;
        sellerName = sd.displayName || sd.name || "Vendedor";
        sellerType = sd.role === "institution" ? "institution" : "teacher";
      }
    }

    // Fetch platform fee if not set on item
    if (feePercentage === undefined) {
      const settingsSnap = await db.collection("settings").doc("platform").get();
      if (settingsSnap.exists) {
        feePercentage = settingsSnap.data()?.fees?.defaultCourseFee ?? 0;
      }
    }

    const isConfirmed = !!paypalTransactionId;

    // Calculate fees for confirmed sales
    const fee = isConfirmed ? Math.round(amount * (feePercentage ?? 0) / 100) : 0;
    const netAmount = isConfirmed ? amount - fee : 0;

    // Get user info
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();

    const saleData: Record<string, unknown> = {
      userId: uid,
      userName: userData?.displayName || userData?.name || "Aluno",
      userEmail: userData?.email || "",
      amount,
      fee,
      netAmount,
      feePercentage: feePercentage ?? 0,
      paymentMethod,
      receiptUrl: receiptUrl || "",
      status: isConfirmed ? "confirmed" : "pending",
      type,
      itemId: itemId || null,
      itemTitle: itemTitle || null,
      paypalTransactionId: paypalTransactionId || null,
      idempotencyKey: idempotencyKey || null,
      sellerId: sellerId || null,
      sellerName: sellerName || null,
      sellerType: sellerType || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saleRef = await db.collection("sales").add(saleData);

    // Grant access immediately for confirmed payments (PayPal)
    if (isConfirmed) {
      const userRef = db.collection("users").doc(uid);

      if (type === "standalone" && itemId) {
        await userRef.update({ enrolledCourses: admin.firestore.FieldValue.arrayUnion(itemId) });

        // Se já existe chat de grupo para este curso, adicionar o aluno como participante
        const groupChatId = `course_${itemId}`;
        const chatRef = db.collection("courseChats").doc(groupChatId);
        const chatSnap = await chatRef.get();
        if (chatSnap.exists) {
          const chatData = chatSnap.data()!;
          if (!chatData.participants?.includes(uid)) {
            const studentName = userData?.displayName || userData?.name || "Aluno";
            const chatUpdate: Record<string, unknown> = {
              participants: admin.firestore.FieldValue.arrayUnion(uid),
              [`participantNames.${uid}`]: studentName,
            };
            if (userData?.photoURL) {
              chatUpdate[`participantPhotos.${uid}`] = userData.photoURL;
            }
            await chatRef.update(chatUpdate);
          }
        }
      } else if (type === "live" && itemId) {
        await userRef.update({ enrolledLives: admin.firestore.FieldValue.arrayUnion(itemId) });
      } else if (type === "smart" || type === "golden") {
        await userRef.update({ plan: type });
      }
    }

    return NextResponse.json({
      success: true,
      saleId: saleRef.id,
      status: isConfirmed ? "confirmed" : "pending",
    });
  } catch (err) {
    console.error("[API] Erro ao criar venda:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento." },
      { status: 500 }
    );
  }
}
