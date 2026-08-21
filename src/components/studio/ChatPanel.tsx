"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { Send, MessageSquare, Hand, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage } from "@/types/live";
import { Avatar, EmptyState } from "./_helpers";

interface Props {
  liveId:    string;
  pinnedMsg: ChatMessage | null;
  onPin:     (m: ChatMessage | null) => void;
  hostName:  string;
}

export function ChatPanel({ liveId, pinnedMsg, onPin, hostName }: Props) {
  const { user }    = useAuth();
  const [msgs,      setMsgs]  = useState<ChatMessage[]>([]);
  const [text,      setText]  = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "chat"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    });
    return () => unsub();
  }, [liveId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const msg = text.trim(); setText("");
    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId, uid: user.uid,
      displayName: user.displayName || hostName,
      photoURL: user.photoURL || "",
      text: msg, type: "message",
      createdAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Pinned */}
      {pinnedMsg && (
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/8 border-l-2 border-amber-400 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold uppercase tracking-widest text-amber-400/70 mb-0.5">Fixado</p>
            <p className="text-sm text-white truncate">{pinnedMsg.text}</p>
          </div>
          <button onClick={() => onPin(null)} className="text-white hover:text-white shrink-0 mt-0.5 text-base leading-none">×</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {msgs.length === 0 && <EmptyState icon={<MessageSquare />} text="Nenhuma mensagem ainda" />}
        {msgs.map(msg => {
          if (msg.hidden) return null;
          return (
            <div key={msg.id} className="group">
              {msg.type === "hand_raise" ? (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-500/8 border-l-2 border-amber-400/50 text-amber-300/80 text-sm my-2">
                  <div className="flex items-center gap-2">
                    <Hand className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-bold">{msg.displayName}</span>
                    <span className="text-white">pediu a palavra</span>
                  </div>
                  <button
                    onClick={() => deleteDoc(doc(db, "lives", liveId, "chat", msg.id!))}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400/50 hover:text-red-400 transition-all"
                    title="Remover"
                  >×</button>
                </div>
              ) : msg.type === "system" ? (
                <div className="text-center text-[13px] text-white py-2 italic">{msg.text}</div>
              ) : (
                <div className="flex gap-2 items-start hover:bg-white/[3%] px-2 py-1.5 -mx-2 transition-colors">
                  <Avatar name={msg.displayName || "?"} size={22} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-bold text-white mr-1.5">{msg.displayName}</span>
                    <span className="text-sm text-white break-words">{msg.text}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => onPin(pinnedMsg?.id === msg.id ? null : msg)}
                      className="p-1 text-white hover:text-amber-400 transition-colors shrink-0"
                      title="Fixar"
                    >📌</button>
                    <button
                      onClick={() => updateDoc(doc(db, "lives", liveId, "chat", msg.id!), { hidden: true, hiddenAt: serverTimestamp() })}
                      className="p-1 text-red-400/50 hover:text-red-400 transition-colors shrink-0"
                      title="Ocultar"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white shrink-0">
        <form onSubmit={send} className="flex gap-2">
          <input
            type="text" value={text} onChange={e => setText(e.target.value)}
            placeholder="Escrever mensagem..."
            className="flex-1 bg-white border border-white px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white transition-colors"
          />
          <button
            type="submit" disabled={!text.trim()}
            className="flex items-center justify-center h-9 w-9 bg-white disabled:bg-white disabled:text-white text-black hover:bg-white transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
