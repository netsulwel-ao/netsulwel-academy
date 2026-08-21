"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp,
} from "firebase/firestore";
import { Mic, MicOff, Hand, Volume2 } from "lucide-react";
import { Avatar, Waveform, SectionLabel, EmptyState } from "./_helpers";

interface Props { liveId: string }

export function PalavraPanel({ liveId }: Props) {
  const [speakers,  setSpeakers]  = useState<Set<string>>(new Set());
  const [queue,     setQueue]     = useState<{ uid: string; name: string; createdAt: Timestamp }[]>([]);

  // Live speakers
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lives", liveId, "speakers"), snap => {
      const s = new Set<string>();
      snap.docs.forEach(d => { if (d.data().canSpeak) s.add(d.id); });
      setSpeakers(s);
    });
    return () => unsub();
  }, [liveId]);

  // Hand-raise queue
  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "handraises"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setQueue(snap.docs.map(d => ({ uid: d.id, ...d.data() } as { uid: string; name: string; createdAt: Timestamp })));
    });
    return () => unsub();
  }, [liveId]);

  const grant  = async (uid: string) => {
    await setDoc(doc(db, "lives", liveId, "speakers", uid), { canSpeak: true }, { merge: true });
    await deleteDoc(doc(db, "lives", liveId, "handraises", uid)).catch(() => {});
  };
  const revoke = async (uid: string) => {
    await setDoc(doc(db, "lives", liveId, "speakers", uid), { canSpeak: false }, { merge: true });
  };

  const speakerList = Array.from(speakers);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Queue */}
      {queue.length > 0 ? (
        <>
          <SectionLabel count={queue.length}>A pedir palavra</SectionLabel>
          {queue.map((h, idx) => (
            <div key={h.uid} className="flex items-center gap-3 px-4 py-3 border-b border-white hover:bg-white/[2%] transition-colors group">
              <span className="text-[13px] font-bold text-white w-4 shrink-0 tabular-nums">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <Avatar name={h.name} />
              <span className="text-sm text-white truncate flex-1">{h.name}</span>
              <button
                onClick={() => grant(h.uid)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-[13px] font-bold hover:bg-white transition-colors"
              >
                <Mic className="h-3 w-3" /> Dar palavra
              </button>
            </div>
          ))}
        </>
      ) : (
        <div className="border-b border-white">
          <SectionLabel>A pedir palavra</SectionLabel>
          <EmptyState icon={<Hand />} text="Quando um aluno pedir a palavra aparece aqui por ordem de chegada" />
        </div>
      )}

      {/* Active speakers */}
      <SectionLabel count={speakerList.length}>Com palavra</SectionLabel>
      {speakerList.length === 0
        ? <EmptyState icon={<Volume2 />} text="Nenhum aluno com microfone ativo" />
        : speakerList.map(uid => (
          <div key={uid} className="flex items-center gap-3 px-4 py-3 border-b border-white border-l-2 border-l-green-500 hover:bg-white/[2%] transition-colors group">
            <Avatar name={uid} />
            <span className="text-sm text-white truncate flex-1">{uid}</span>
            <Waveform />
            <button
              onClick={() => revoke(uid)}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 text-[13px] font-bold transition-colors opacity-0 group-hover:opacity-100"
            >
              <MicOff className="h-3 w-3" /> Silenciar
            </button>
          </div>
        ))
      }
    </div>
  );
}
