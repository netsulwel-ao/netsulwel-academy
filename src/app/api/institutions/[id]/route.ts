import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    const docRef = db.collection("institutions").doc(id);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    return NextResponse.json({ institution: { id: snapshot.id, ...snapshot.data() } });
  } catch (error) {
    console.error("Error fetching institution:", error);
    return NextResponse.json({ error: "Failed to fetch institution" }, { status: 500 });
  }
}

export async function PUT(
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

    // Verificar se é admin da instituição ou admin global
    const userSnap = await db.collection("users").doc(uid).get();
    const userData = userSnap.data();
    if (userData?.role !== "admin" && userData?.institutionId !== id) {
      return NextResponse.json({ error: "Sem permissão para editar esta instituição." }, { status: 403 });
    }
    
    const body = await req.json();
    const { name, email, phone, address, logo, banner, description, website, status } = body;
    
    const docRef = db.collection("institutions").doc(id);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (logo !== undefined) updateData.logo = logo;
    if (banner !== undefined) updateData.banner = banner;
    if (description !== undefined) updateData.description = description;
    if (website !== undefined) updateData.website = website;
    if (status !== undefined) updateData.status = status;
    
    await docRef.update(updateData);
    
    const updatedSnapshot = await docRef.get();
    return NextResponse.json({ institution: { id: updatedSnapshot.id, ...updatedSnapshot.data() } });
  } catch (error) {
    console.error("Error updating institution:", error);
    return NextResponse.json({ error: "Failed to update institution" }, { status: 500 });
  }
}

export async function DELETE(
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

    const userSnap = await db.collection("users").doc(uid).get();
    if (userSnap.data()?.role !== "admin") {
      return NextResponse.json({ error: "Apenas administradores podem remover instituições." }, { status: 403 });
    }

    const docRef = db.collection("institutions").doc(id);
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    await docRef.delete();
    
    return NextResponse.json({ message: "Institution deleted successfully" });
  } catch (error) {
    console.error("Error deleting institution:", error);
    return NextResponse.json({ error: "Failed to delete institution" }, { status: 500 });
  }
}
