import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    
    // Find invitation by token
    const invitationsSnapshot = await db.collection("institutionInvitations")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .get();
    
    if (invitationsSnapshot.empty) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await invitationDoc.ref.update({ status: "expired" });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }
    
    // Get institution details
    const institutionSnapshot = await db.collection("institutions").doc(invitation.institutionId).get();
    if (!institutionSnapshot.exists) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    const institution = institutionSnapshot.data();
    
    return NextResponse.json({ 
      invitation: { id: invitationDoc.id, ...invitation },
      institution: { id: institutionSnapshot.id, ...institution }
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json({ error: "Failed to validate invitation" }, { status: 500 });
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
    const { token, userId } = body;
    
    if (!token || !userId) {
      return NextResponse.json({ error: "Token and userId are required" }, { status: 400 });
    }

    // O userId tem de corresponder ao utilizador autenticado
    if (userId !== uid) {
      return NextResponse.json({ error: "Não podes aceitar um convite em nome de outro utilizador." }, { status: 403 });
    }
    
    // Find and validate invitation
    const invitationsSnapshot = await db.collection("institutionInvitations")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .get();
    
    if (invitationsSnapshot.empty) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    // Check if invitation is expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await invitationDoc.ref.update({ status: "expired" });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }
    
    // Check if user exists
    const userSnapshot = await db.collection("users").doc(userId).get();
    if (!userSnapshot.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Check if user email matches invitation email
    const userData = userSnapshot.data();
    if (!userData || userData.email !== invitation.email) {
      return NextResponse.json({ error: "User email does not match invitation email" }, { status: 400 });
    }
    
    // Update user with institution info
    await userSnapshot.ref.update({
      institutionId: invitation.institutionId,
      institutionRole: invitation.role === "teacher" ? "teacher" : "student",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark invitation as accepted
    await invitationDoc.ref.update({
      status: "accepted",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({ message: "Invitation accepted successfully" });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
