import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    
    let queryRef: any = db.collection("institutions");
    if (status) {
      queryRef = queryRef.where("status", "==", status);
    }
    queryRef = queryRef.orderBy("createdAt", "desc");
    
    const snapshot = await queryRef.get();
    const institutions = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return NextResponse.json({ error: "Failed to fetch institutions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (error || !uid) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    const body = await req.json();
    const { name, email, phone, address, logo, adminId } = body;
    
    if (!name || !email || !adminId) {
      return NextResponse.json({ error: "Name, email, and adminId are required" }, { status: 400 });
    }

    // O adminId tem de corresponder ao utilizador autenticado
    if (adminId !== uid) {
      return NextResponse.json({ error: "Não podes criar uma instituição para outro utilizador." }, { status: 403 });
    }
    
    // Check if email already exists
    const existingSnapshot = await db.collection("institutions").where("email", "==", email).get();
    if (!existingSnapshot.empty) {
      return NextResponse.json({ error: "Institution with this email already exists" }, { status: 400 });
    }
    
    const institutionData = {
      name,
      email,
      phone: phone || null,
      address: address || null,
      logo: logo || null,
      status: "pending",
      adminId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection("institutions").add(institutionData);
    
    // Update the user to have institution admin role
    await db.collection("users").doc(adminId).update({
      institutionId: docRef.id,
      institutionRole: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ 
      institution: { id: docRef.id, ...institutionData },
      message: "Institution created successfully. Pending approval."
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating institution:", error);
    return NextResponse.json({ error: "Failed to create institution" }, { status: 500 });
  }
}
