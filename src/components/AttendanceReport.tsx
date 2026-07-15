"use client";

import { useState } from "react";
import { Download, Loader2, FileJson, FileText } from "lucide-react";
import type { LiveSession } from "@/types/live";

interface AttendanceReportProps {
  liveId: string;
  liveTitle?: string;
  isTeacher: boolean;
}

interface AttendeeData {
  name: string;
  joinedAt: string;
  leftAt?: string;
  durationMinutes: number;
  durationFormatted: string;
}

/**
 * Attendance Report component
 * Shows attendance list and provides download options
 * Only visible to teachers/professors
 */
export function AttendanceReport({ liveId, liveTitle, isTeacher }: AttendanceReportProps) {
  const [attendees, setAttendees] = useState<AttendeeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isTeacher) {
    return null;
  }

  const handleLoadReport = async () => {
    if (attendees.length > 0) {
      setExpanded(!expanded);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/livekit/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          format: "json",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao carregar relatório");
      }

      const data = await res.json();
      setAttendees(data.attendees);
      setExpanded(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Error loading report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/livekit/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          format: "csv",
        }),
      });

      if (!res.ok) throw new Error("Erro ao descarregar CSV");

      const csv = await res.text();
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${liveId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading CSV:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/livekit/attendance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveId,
          format: "json",
        }),
      });

      if (!res.ok) throw new Error("Erro ao descarregar JSON");

      const data = await res.json();
      const json = JSON.stringify(data, null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${liveId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading JSON:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a1a1e] border border-white/8 rounded-lg overflow-hidden">
      {/* Header / Collapsed View */}
      <button
        onClick={handleLoadReport}
        disabled={loading}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded flex items-center justify-center">
            {loading ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <FileText size={20} className="text-white" />
            )}
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">Relatório de Presença</h3>
            <p className="text-xs text-white/50">
              {attendees.length > 0 ? `${attendees.length} participantes` : "Clique para carregar"}
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 size={20} className="text-white/50 animate-spin" />
        ) : (
          <svg
            className={`w-5 h-5 text-white/50 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        )}
      </button>

      {/* Expanded View */}
      {expanded && (
        <div className="border-t border-white/8 p-4 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-xs p-3 rounded">
              {error}
            </div>
          )}

          {/* Attendees Table */}
          {attendees.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-white/80">
                <thead className="text-white/50 border-b border-white/8">
                  <tr>
                    <th className="text-left py-2 px-2">Nome</th>
                    <th className="text-left py-2 px-2">Entrou em</th>
                    <th className="text-left py-2 px-2">Duração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendees.map((attendee, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="py-2 px-2 text-white/90">{attendee.name}</td>
                      <td className="py-2 px-2">
                        {new Date(attendee.joinedAt).toLocaleTimeString("pt-PT")}
                      </td>
                      <td className="py-2 px-2 font-medium text-blue-400">
                        {attendee.durationFormatted}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary */}
          {attendees.length > 0 && (
            <div className="bg-white/5 p-3 rounded border border-white/8">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-white/50">Total de Participantes</p>
                  <p className="text-lg font-bold text-white">{attendees.length}</p>
                </div>
                <div>
                  <p className="text-white/50">Tempo Médio</p>
                  <p className="text-lg font-bold text-white">
                    {Math.round(
                      attendees.reduce((sum, a) => sum + a.durationMinutes, 0) /
                        attendees.length
                    )}
                    m
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownloadCSV}
              disabled={loading || attendees.length === 0}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            >
              <Download size={14} />
              CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              disabled={loading || attendees.length === 0}
              className="flex items-center justify-center gap-2 py-2 px-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            >
              <FileJson size={14} />
              JSON
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setExpanded(false)}
            className="w-full py-2 text-white/50 hover:text-white text-xs font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
