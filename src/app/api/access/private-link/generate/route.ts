import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/api-auth";
import type { PrivateAccessLink } from "@/types/access";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { uid, error } = await verifyAuth(request);
    if (error || !uid) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { liveId, courseId, expiresIn, maxUses } = body;

    if (!liveId && !courseId) {
      return NextResponse.json(
        { error: "courseId or liveId required" },
        { status: 400 }
      );
    }

    // Get user role to verify permissions
    const admin = getFirebaseAdmin();
    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userRole = userDoc.data()?.role;
    if (!["admin", "teacher"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only teachers and admins can create links" },
        { status: 403 }
      );
    }

    // If creating link for a live, verify user is the creator
    if (liveId) {
      const liveDoc = await db.collection("lives").doc(liveId).get();
      if (!liveDoc.exists) {
        return NextResponse.json(
          { error: "Live session not found" },
          { status: 404 }
        );
      }
      
      if (liveDoc.data()?.createdBy !== uid && userRole !== "admin") {
        return NextResponse.json(
          { error: "You can only create links for your own live sessions" },
          { status: 403 }
        );
      }
    }

    // If creating link for a course, verify user is the creator
    if (courseId) {
      const courseDoc = await db.collection("courses").doc(courseId).get();
      if (!courseDoc.exists) {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 }
        );
      }
      
      if (courseDoc.data()?.createdBy !== uid && userRole !== "admin") {
        return NextResponse.json(
          { error: "You can only create links for your own courses" },
          { status: 403 }
        );
      }
    }

    // Generate unique token (30 chars)
    const token = 
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const linkData: any = {
      token,
      courseId: courseId || null,
      liveId: liveId || null,
      createdBy: uid,
      createdAt: new Date().toISOString(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null,
      maxUses: maxUses && maxUses > 0 ? maxUses : null,
      usedCount: 0,
      usedBy: [],
      status: "active",
    };

    console.log("[API] Creating private access link:", {
      token: token.substring(0, 10) + "...",
      liveId,
      courseId,
      createdBy: uid,
    });

    const docRef = await db.collection("private_access_links").add(linkData);

    console.log("[API] Link created successfully:", docRef.id);

    // Build share URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://academia.netsulwel.tech'}/access/${token}`;

    return NextResponse.json(
      {
        success: true,
        token,
        shareUrl,
        linkId: docRef.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API ERROR] Failed to create link:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as any)?.code;
    
    console.error("[API ERROR] Details:", {
      message: errorMessage,
      code: errorCode,
    });

    return NextResponse.json(
      { 
        error: "Erro ao gerar link: " + errorMessage,
      },
      { status: 500 }
    );
  }
}
