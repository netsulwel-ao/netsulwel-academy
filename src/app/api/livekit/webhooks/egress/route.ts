import { NextRequest } from "next/server";
import crypto from "crypto";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/webhooks/egress
 * Webhook handler for LiveKit egress events
 * 
 * Receives:
 * - egress.started
 * - egress.updated
 * - egress.finished
 * 
 * When egress.finished is received, download the recording from S3/R2
 * and generate a signed URL for playback.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const signature = req.headers.get("x-livekit-signature");
    const body = await req.text();

    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.warn("Invalid webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("LiveKit webhook event:", event.event);

    // Only handle egress.finished events
    if (event.event !== "egress.finished") {
      return Response.json({ success: true });
    }

    const egress = event.egress;
    const egressId = egress.egressId;
    const result = egress.result;

    // Parse liveId from file path (recordings/{liveId}/{timestamp}.mp4)
    if (!result || !result.file) {
      console.error("No file result in egress event");
      return Response.json({ error: "No file result" }, { status: 400 });
    }

    const filepath = result.file.filepath;
    const liveId = extractLiveIdFromPath(filepath);

    if (!liveId) {
      console.error("Could not extract liveId from filepath:", filepath);
      return Response.json({ error: "Invalid filepath" }, { status: 400 });
    }

    // Get live session from Firestore
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();

    if (!liveDoc.exists) {
      console.error("Live session not found:", liveId);
      return Response.json({ error: "Live not found" }, { status: 404 });
    }

    // Generate signed URL for the recorded file
    const recordingUrl = await generateSignedUrl(filepath);

    // Update Firestore with recording ready status
    await admin.firestore().collection("lives").doc(liveId).update({
      recordingStatus: "ready",
      recordingUrl,
      updatedAt: new Date().toISOString(),
    });

    // Optionally, send notification to students that recording is ready
    await notifyRecordingReady(admin, liveId);

    return Response.json({
      success: true,
      message: "Recording processed successfully",
      recordingUrl,
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!secret) {
    console.warn("LIVEKIT_API_SECRET not set, skipping signature verification");
    return true; // In development, skip verification
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return hash === signature;
}

function extractLiveIdFromPath(filepath: string): string | null {
  // Expected format: recordings/{liveId}/{timestamp}.mp4
  const match = filepath.match(/recordings\/([^/]+)\/[\d]+\.mp4/);
  return match ? match[1] : null;
}

async function generateSignedUrl(filepath: string): Promise<string> {
  // Use AWS SDK to generate signed URL for S3/R2
  const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

  const s3Client = new S3Client({
    region: process.env.S3_REGION || process.env.R2_REGION || "",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT,
    forcePathStyle: true,
  });

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET || process.env.R2_BUCKET_NAME,
    Key: filepath,
  });

  // Generate signed URL valid for 7 days
  const url = await getSignedUrl(s3Client, command, { expiresIn: 7 * 24 * 60 * 60 });

  return url;
}

async function notifyRecordingReady(admin: any, liveId: string) {
  try {
    // Get all students who participated in the live session
    const accessLogsRef = admin
      .firestore()
      .collection("lives")
      .doc(liveId)
      .collection("access_logs");

    const snapshot = await accessLogsRef.get();
    const studentIds = new Set<string>();

    snapshot.forEach((doc: any) => {
      if (doc.data().userId) {
        studentIds.add(doc.data().userId);
      }
    });

    // Create notification for each student
    if (studentIds.size > 0) {
      const batch = admin.firestore().batch();
      studentIds.forEach((studentId) => {
        const ref = admin
          .firestore()
          .collection("users")
          .doc(studentId)
          .collection("notifications")
          .doc();
        batch.set(ref, {
          uid: studentId,
          type: "recording_ready",
          title: "Gravação Pronta",
          message: "A gravação da aula está pronta para visualização.",
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error("Error notifying students:", error);
    // Don't fail the webhook if notification fails
  }
}
