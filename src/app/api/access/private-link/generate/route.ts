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

    const body = await request.json();
    const { liveId, courseId, expiresIn, maxUses } = body;

    if (!liveId && !courseId) {
      return NextResponse.json(
        { error: "courseId or liveId required" },
        { status: 400 }
      );
    }

    // Generate unique token (30 chars)
    const token = 
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Create link in Firestore
    const linkData = {
      token,
      courseId: courseId || null,
      liveId: liveId || null,
      createdBy: "system",
      createdAt: new Date().toISOString(),
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn).toISOString() : null,
      maxUses: maxUses && maxUses > 0 ? maxUses : null,
      usedCount: 0,
      usedBy: [],
      status: "active",
    };

    const docRef = await addDoc(collection(db, "private_access_links"), linkData);

    // Build share URL
    const shareUrl = `https://academia.netsulwel.tech/access/${token}`;

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
    console.error("Erro ao gerar link privado:", error);
    return NextResponse.json(
      { error: "Erro ao gerar link: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
