"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, onSnapshot, deleteDoc, doc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { User, Hand, X, Check } from "lucide-react";

interface AlunosPanelProps {
  liveId: string;
}

interface Participant {
  sessionId: string;
  uid?: string;
  role: string;
  createdAt: string;
}

interface HandRaise {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  createdAt?: any;
}

export function AlunosPanel({ liveId }: AlunosPanelProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "sessions"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          sessionId: d.id,
          ...d.data(),
        })) as Participant[];
        setParticipants(list);
      }
    );
    return () => unsub();
  }, [liveId]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "lives", liveId, "handraises"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as HandRaise[];
        setHandRaises(list);
      }
    );
    return () => unsub();
  }, [liveId]);

  // ─── Approve: add to speakers + remove hand raise ──────────
  const handleApprove = async (hr: HandRaise) => {
    await setDoc(doc(db, "lives", liveId, "speakers", hr.uid), {
      uid: hr.uid,
      displayName: hr.displayName,
      approvedAt: serverTimestamp(),
    });
    await deleteDoc(doc(db, "lives", liveId, "handraises", hr.id));
  };

  // ─── Deny: just remove hand raise ──────────────────────────
  const handleDeny = async (raiseId: string) => {
    await deleteDoc(doc(db, "lives", liveId, "handraises", raiseId));
  };

  const viewers = participants.filter((p) => p.role === "viewer");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hand raises */}
      {handRaises.length > 0 && (
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Hand className="h-3.5 w-3.5 text-amber-400" />
            <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Pediram para falar ({handRaises.length})
            </h4>
          </div>
          <div className="space-y-1.5">
            {handRaises.map((hr) => (
              <div
                key={hr.id}
                className="flex items-center gap-2 px-2.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <div className="h-7 w-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-amber-400">
                    {hr.displayName
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-white truncate flex-1 min-w-0">
                  {hr.displayName}
                </p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleApprove(hr)}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    title="Aprovar — ligar microfone"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeny(hr.id)}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Recusar"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected viewers */}
      <div className="p-3 space-y-1.5">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Conectados ({viewers.length})
        </h4>
        {viewers.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">
            Nenhum aluno conectado
          </div>
        ) : (
          viewers.map((p) => (
            <div
              key={p.sessionId}
              className="flex items-center gap-2.5 px-2.5 py-2 bg-gray-800/30 rounded-lg"
            >
              <div className="h-7 w-7 rounded-full bg-gray-700/50 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">
                  {p.uid ? p.uid.slice(0, 10) + "..." : p.sessionId.slice(0, 10) + "..."}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
