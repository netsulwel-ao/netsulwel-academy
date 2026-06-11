"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, doc, onSnapshot } from "firebase/firestore";
import { Megaphone, Loader2, Calendar } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function StudentInstitutionAnnouncements() {
  const { institutionId } = useAuth();
  const [institutionName, setInstitutionName] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) setInstitutionName(snap.data().name || "");
    });
    return () => unsub();
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId) return;
    loadAnnouncements();
  }, [institutionId]);

  const loadAnnouncements = async () => {
    try {
      const q = query(
        collection(db, "institutionAnnouncements"),
        where("institutionId", "==", institutionId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-56 bg-gray-800 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Comunicados</h1>
            <p className="text-sm sm:text-base text-gray-400">{institutionName}</p>
          </div>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-8 sm:p-16 text-center">
          <div className="relative inline-flex mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full" />
            <Megaphone className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhum comunicado</h3>
          <p className="text-gray-400">Ainda não há comunicados publicados pela instituição.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 hover:border-amber-500/30 transition-all duration-300 p-4 sm:p-6">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-700 rounded-l" />
              <div className="relative flex items-start gap-3 sm:gap-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Megaphone className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-2">
                    <h3 className="font-bold text-white text-base sm:text-lg">{a.title}</h3>
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {a.createdAt.toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
