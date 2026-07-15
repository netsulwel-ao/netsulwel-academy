import { NextRequest } from "next/server";
import { verifyAuth } from "@/lib/api-auth";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

/**
 * POST /api/livekit/attendance/report
 * Generate attendance report for a live session
 * 
 * Body:
 * {
 *   liveId: string,
 *   format: "json" | "csv" | "pdf" (default: "json")
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { uid, error } = await verifyAuth(req);
    if (!uid) return Response.json({ error }, { status: 401 });

    const { liveId, format = "json" } = await req.json();

    if (!liveId) {
      return Response.json(
        { error: "liveId é obrigatório." },
        { status: 400 }
      );
    }

    if (!["json", "csv", "pdf"].includes(format)) {
      return Response.json(
        { error: "format deve ser 'json', 'csv' ou 'pdf'." },
        { status: 400 }
      );
    }

    // Verify user is teacher/admin for this live session
    const admin = getFirebaseAdmin();
    const liveDoc = await admin.firestore().collection("lives").doc(liveId).get();

    if (!liveDoc.exists) {
      return Response.json({ error: "Aula não encontrada." }, { status: 404 });
    }

    const liveData = liveDoc.data();
    if (liveData?.createdBy !== uid) {
      return Response.json(
        { error: "Não tem permissão para gerar este relatório." },
        { status: 403 }
      );
    }

    // Fetch all attendance events
    const attendanceData = await fetchAttendanceData(admin, liveId, liveData);

    // Format the response based on requested format
    if (format === "csv") {
      return new Response(generateCSV(attendanceData), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="attendance_${liveId}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // For PDF generation, we'll return JSON data and let client handle PDF generation
      // Alternative: use PDFKit on server side
      return Response.json({
        format: "pdf",
        data: attendanceData,
        message: "Use a biblioteca PDF do cliente para gerar o ficheiro.",
      });
    }

    // Default: return JSON
    return Response.json({
      liveId,
      liveTitle: liveData?.title,
      startedAt: liveData?.startedAt,
      endedAt: liveData?.endedAt,
      attendees: attendanceData,
      total: attendanceData.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao gerar relatório de presença:", error);
    return Response.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

async function fetchAttendanceData(
  admin: any,
  liveId: string,
  liveData: any
): Promise<any[]> {
  const attendees = new Map<
    string,
    { name: string; joinedAt: string; leftAt?: string; duration: number }
  >();

  // Get attendance events from access_logs subcollection
  const accessLogsRef = admin
    .firestore()
    .collection("lives")
    .doc(liveId)
    .collection("access_logs");

  const snapshot = await accessLogsRef.orderBy("timestamp", "asc").get();

  const liveEndTime = liveData?.endedAt
    ? new Date(liveData.endedAt).getTime()
    : Date.now();

  snapshot.forEach((doc: any) => {
    const data = doc.data();
    const userId = data.userId;
    const userName = data.displayName || "Utilizador Anónimo";
    const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);

    if (!attendees.has(userId)) {
      attendees.set(userId, {
        name: userName,
        joinedAt: timestamp.toISOString(),
        duration: 0,
      });
    }
  });

  // Calculate duration for each attendee
  const result = Array.from(attendees.values()).map((attendee) => {
    const joinTime = new Date(attendee.joinedAt).getTime();
    const leftTime = attendee.leftAt ? new Date(attendee.leftAt).getTime() : liveEndTime;
    const duration = Math.round((leftTime - joinTime) / 60000); // minutes

    return {
      name: attendee.name,
      joinedAt: attendee.joinedAt,
      leftAt: attendee.leftAt,
      durationMinutes: duration,
      durationFormatted: formatDuration(duration),
    };
  });

  // Sort by join time
  return result.sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
}

function generateCSV(attendees: any[]): string {
  const headers = ["Nome", "Entrou em", "Saiu em", "Duração (min)", "Duração Formatada"];
  const rows = attendees.map((attendee) => [
    `"${attendee.name}"`,
    new Date(attendee.joinedAt).toLocaleString("pt-PT"),
    attendee.leftAt ? new Date(attendee.leftAt).toLocaleString("pt-PT") : "Ainda Presente",
    attendee.durationMinutes,
    attendee.durationFormatted,
  ]);

  // Combine headers and rows
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  return csv;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}
