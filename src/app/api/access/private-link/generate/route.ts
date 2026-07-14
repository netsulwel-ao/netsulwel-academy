import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import type { PrivateAccessLink } from "@/types/access";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    // Extract uid from Authorization header if needed (Firebase handles this)
    const body = await request.json();
    const { liveId, courseId, expiresIn, maxUses } = body;

    if (!liveId && !courseId) {
      return NextResponse.json(
        { error: "courseId or liveId required" },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = Math.random()
      .toString(36)
      .substring(2, 15)
      .concat(Math.random().toString(36).substring(2, 15))
      .concat(Math.random().toString(36).substring(2, 15));

    // Create link in Firestore
    const newLink: Omit<PrivateAccessLink, "id"> = {
      token,
      courseId,
      liveId,
      createdBy: "system", // Will be updated with real UID if needed
      createdAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      maxUses: maxUses && maxUses > 0 ? maxUses : undefined,
      usedCount: 0,
      usedBy: [],
      status: "active",
    };

    const docRef = await addDoc(collection(db, "private_access_links"), newLink);

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://academia.netsulwel.tech";
    const shareUrl = `${baseUrl}/access/${token}`;

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      linkId: docRef.id,
    });
  } catch (error) {
    console.error("Erro ao gerar link:", error);
    return NextResponse.json(
      { error: "Erro ao gerar link" },
      { status: 500 }
    );
  }
}
