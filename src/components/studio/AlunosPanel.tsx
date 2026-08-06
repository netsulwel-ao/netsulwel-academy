"use client";

import { useEffect, useState } from "react";
import { useParticipants, useLocalParticipant } from "@livekit/components-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Users, X } from "lucide-react";
import { Avatar, Waveform, SectionLabel, EmptyState } from "./_helpers";

interface Props { liveId: string }

export function AlunosPanel({ liveId }: Props) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [speakers, setSpeakers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "lives", liveId, "speakers"), snap => {
      const s = new Set<string>();
      snap.docs.forEach(d => { if (d.data().canSpeak) s.add(d.id); });
      setSpeakers(s);
    });
    return () => unsub();
  }, [liveId]);

  const students = participants.filter(p => !p.isLocal);

  return (
    <div className="flex flex-col h-full">
      <SectionLabel count={students.length}>Conectados</SectionLabel>
      <div className="flex-1 overflow-y-auto">
        {students.length === 0
          ? <EmptyState icon={<Users />} text="Nenhum aluno conectado ainda" />
          : students.map(p => {
            const isSpeaker = speakers.has(p.identity);
            const name = p.name || p.identity;
            return (
              <div
                key={p.identity}
                className={[
                  "flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-colors group",
                  isSpeaker ? "border-l-2 border-l-green-500 bg-green-500/[3%]" : "hover:bg-white/[2%]",
                ].join(" ")}
              >
                <span className={`w-1.5 h-1.5 shrink-0 ${isSpeaker ? "bg-green-400" : "bg-white/15"}`} />
                <Avatar name={name} size={28} />
                <span className="text-sm text-white/70 truncate flex-1">{name}</span>
                {isSpeaker && <Waveform />}
                {/* Kick placeholder — todo */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title={`Remover ${name}`}
                    className="p-1 text-red-400/50 hover:text-red-400 transition-colors"
                    onClick={() => {/* TODO: kick via LiveKit API */}}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
