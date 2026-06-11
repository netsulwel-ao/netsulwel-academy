"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, onSnapshot } from "firebase/firestore";
import { GraduationCap, Loader2, Users } from "lucide-react";

interface Class {
  id: string;
  name: string;
  description: string;
  memberCount: number;
}

export default function StudentInstitutionClasses() {
  const { user, institutionId } = useAuth();
  const [institutionName, setInstitutionName] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) setInstitutionName(snap.data().name || "");
    });
    return () => unsub();
  }, [institutionId]);

  useEffect(() => {
    if (!institutionId || !user) return;
    loadData();
  }, [institutionId, user]);

  const loadData = async () => {
    try {
      const classesSnap = await getDocs(query(collection(db, "institutionClasses"), where("institutionId", "==", institutionId)));
      const list: Class[] = classesSnap.docs.map(d => {
        const data = d.data();
        const memberIds: string[] = data.members || [];
        return {
          id: d.id,
          name: data.name,
          description: data.description,
          memberCount: memberIds.length,
        };
      });
      setClasses(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[100rem] space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-gray-800/60 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-3xl rounded-full" />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Turmas</h1>
            <p className="text-sm sm:text-base text-gray-400">{institutionName}</p>
          </div>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-8 sm:p-16 text-center">
          <div className="relative inline-flex mb-4 sm:mb-6">
            <div className="absolute inset-0 bg-cyan-500/10 blur-2xl rounded-full" />
            <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 text-gray-600 relative" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Nenhuma turma</h3>
          <p className="text-gray-400">Ainda não há turmas criadas pela instituição.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {classes.map(c => (
            <div key={c.id} className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 border border-gray-800/70 p-4 sm:p-6 hover:border-cyan-500/30 transition-all duration-300">
              <div className="relative">
                <div className="flex items-center gap-3 mb-3 sm:mb-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-700/20 flex items-center justify-center border border-cyan-500/10 shrink-0">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base sm:text-lg truncate">{c.name}</h3>
                    {c.description && <p className="text-xs sm:text-sm text-gray-400 truncate">{c.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{c.memberCount} membro{c.memberCount !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
