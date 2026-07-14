import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log("[DEBUG] Testing Firebase Admin SDK...");
    
    const admin = getFirebaseAdmin();
    console.log("[DEBUG] Admin SDK initialized:", admin ? "✓" : "✗");
    
    const db = admin.firestore();
    console.log("[DEBUG] Firestore instance created:", db ? "✓" : "✗");
    
    // Try a simple read to test connectivity
    const settingsRef = await db.collection("settings").doc("system").get();
    console.log("[DEBUG] Firestore read test:", settingsRef.exists ? "✓ Connected" : "✓ Connected (doc not found)");
    
    // Try creating a test document
    const testDocRef = await db.collection("_test_admin").add({
      timestamp: new Date().toISOString(),
      test: "admin-sdk-works",
    });
    console.log("[DEBUG] Firestore write test: ✓ Document created:", testDocRef.id);
    
    // Delete the test document
    await testDocRef.delete();
    console.log("[DEBUG] Firestore delete test: ✓ Document deleted");
    
    return NextResponse.json(
      {
        status: "success",
        message: "Admin SDK is working correctly",
        adminInitialized: true,
        firestoreConnected: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[DEBUG ERROR]", error);
    
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        error: {
          name: (error as any)?.name,
          code: (error as any)?.code,
          message: error instanceof Error ? error.message : "Unknown",
        },
      },
      { status: 500 }
    );
  }
}
