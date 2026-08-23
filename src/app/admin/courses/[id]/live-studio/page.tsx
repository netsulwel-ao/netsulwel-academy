"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2, Radio, ArrowLeft, Play, XCircle,
} from "lucide-react";
import type { Course } from "@/types/course";

function getLessonStatus(scheduledAt: string | undefined, durationStr: string | undefined): { status: "scheduled" | "live" | "ended"; label: string } {
  if (!scheduledAt) return { status: "scheduled", label: "Agendada" };
  const now = new Date();
  const start = new Date(scheduledAt);
  const durationMin = parseInt(durationStr || "0") || 0;
  const end = new Date(start.getTime() + durationMin * 60000);
  if (now >= start && now <= end) return { status: "live", label: "Ao Vivo" };
  if (now < start) return { status: "scheduled", label: "Agendada" };
  return { status: "ended", label: "Realizada" };
}

export default function CourseLiveStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [launchingKey, setLaunchingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "courses", id)).then((snap) => {
      if (!snap.exists()) { router.push("/admin/courses"); return; }
      setCourse({ id: snap.id, ...snap.data() } as Course);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, router]);

  const handleLaunch = useCallback(async (mi: number, vi: number, roomName: string) => {
    if (!user || !course) return;
    const key = `${mi}-${vi}`;
    setLaunchingKey(key);

    try {
      // Find existing live with this roomName
      const livesQuery = query(collection(db, "lives"), where("roomName", "==", roomName));
      const livesSnap = await getDocs(livesQuery);

      let liveId: string;

      if (!livesSnap.empty) {
        // Live already exists
        liveId = livesSnap.docs[0].id;
      } else {
        // Create a new live session for this lesson
        const video = course.modules?.[mi]?.videos?.[vi];
        const docRef = await addDoc(collection(db, "lives"), {
          title: video?.title || course.title,
          description: course.description || "",
          thumbnail: course.thumbnail || "",
          scheduledAt: video?.scheduledAt || "",
          target: "free",
          price: null,
          status: "scheduled",
          createdBy: user.uid,
          institutionId: (user as unknown as Record<string, unknown>).institutionId || null,
          hostName: user.displayName || user.email || "Professor",
          roomName,
          participantCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        liveId = docRef.id;
      }

      router.push(`/admin/lives/${liveId}/studio?courseId=${course.id}&mi=${mi}&vi=${vi}`);
    } catch (err) {
      console.error("Failed to launch live:", err);
    } finally {
      setLaunchingKey(null);
    }
  }, [user, course, router]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-purple" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 animate-in fade-in duration-500">
      <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar aos cursos
      </Link>

      <div className="bg-gray-900 border border-gray-800 p-6 mb-6">
        <h1 className="text-xl font-bold text-white">{course.title}</h1>
        <p className="text-sm text-gray-400 mt-1">Estúdio de Aulas ao Vivo</p>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold bg-purple-500/15 text-purple-400 border border-purple-500 mt-2">
          <Radio className="h-3.5 w-3.5" /> Ao Vivo
        </span>
      </div>

      <div className="space-y-3">
        {course.modules?.map((module, mi) => (
          <div key={mi} className="bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-5 py-3 bg-gray-900 border-b border-gray-800">
              <p className="text-sm font-bold text-blue-400 uppercase tracking-wider">
                Módulo {mi + 1}{module.title ? ` — ${module.title}` : ""}
              </p>
            </div>
            <div className="divide-y divide-gray-800">
              {module.videos.map((video, vi) => {
                if (!video.scheduledAt) return null;
                const st = getLessonStatus(video.scheduledAt, video.duration);
                const btnKey = `${mi}-${vi}`;
                const isLaunching = launchingKey === btnKey;
                return (
                  <div key={vi} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${
                      st.status === "live" ? "bg-green-600 animate-pulse" :
                      st.status === "ended" ? "bg-gray-800" : "bg-gray-800"
                    }`}>
                      {st.status === "live" ? <Radio className="h-5 w-5 text-white" /> :
                       st.status === "ended" ? <XCircle className="h-5 w-5 text-gray-500" /> :
                       <Radio className="h-5 w-5 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{video.title || `Aula ${vi + 1}`}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{new Date(video.scheduledAt).toLocaleString("pt-AO")}</p>
                      {video.duration && <p className="text-sm text-gray-600">Duração: {video.duration} min</p>}
                    </div>
                    <span className={`px-2.5 py-1 text-sm font-bold uppercase tracking-wider ${
                      st.status === "live" ? "bg-green-500/15 text-green-400 border border-green-500" :
                      st.status === "ended" ? "bg-gray-800 text-gray-500 border border-gray-700" :
                      "bg-blue-500/15 text-blue-400 border border-blue-500"
                    }`}>{st.label}</span>
                    <div className="flex gap-2 shrink-0">
                      {st.status !== "ended" && (
                        <button
                          onClick={() => handleLaunch(mi, vi, video.roomName ?? "")}
                          disabled={isLaunching}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
                            st.status === "live"
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-purple hover:bg-purple-light text-white"
                          } disabled:opacity-50`}
                        >
                          {isLaunching ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isLaunching ? "A abrir..." : st.status === "live" ? "Transmitir" : "Iniciar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
