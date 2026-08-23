"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Send, EyeOff, Pin, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  uid: string;
  displayName: string;
  photoURL?: string;
  text: string;
  type: "message" | "hand_raise" | "system";
  hidden?: boolean;
  createdAt?: any;
}

interface LiveChatProps {
  liveId: string;
  role: "host" | "viewer";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-purple/30 text-purple",
  "bg-blue-500/20 text-blue-400",
  "bg-emerald-500/20 text-emerald-400",
  "bg-amber-500/20 text-amber-400",
  "bg-rose-500/20 text-rose-400",
  "bg-cyan-500/20 text-cyan-400",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function LiveChat({ liveId, role }: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isHost = role === "host";

  // ─── Listen for messages ───────────────────────────────────
  useEffect(() => {
    const q = query(
      collection(db, "lives", liveId, "chat"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
        .filter((m) => !m.hidden);
      setMessages(msgs);
    });

    return () => unsub();
  }, [liveId]);

  // ─── Auto scroll ───────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Send message ──────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !user) return;

    await addDoc(collection(db, "lives", liveId, "chat"), {
      liveId,
      uid: user.uid,
      displayName: user.displayName || (isHost ? "Professor" : "Aluno"),
      photoURL: user.photoURL || null,
      text: input.trim(),
      type: "message",
      createdAt: serverTimestamp(),
    });

    setInput("");
    inputRef.current?.focus();
  };

  // ─── Hide message (host only) ─────────────────────────────
  const handleHide = async (msgId: string) => {
    await updateDoc(doc(db, "lives", liveId, "chat", msgId), {
      hidden: true,
      hiddenAt: serverTimestamp(),
    });
  };

  // ─── Pin message (host only) ──────────────────────────────
  const handlePin = (msgId: string) => {
    setPinnedId(pinnedId === msgId ? null : msgId);
  };

  const pinnedMessage = pinnedId ? messages.find((m) => m.id === pinnedId) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Pinned message */}
      {isHost && pinnedMessage && (
        <div className="px-3 py-2.5 bg-purple/10 border-b border-purple/20 flex items-start gap-2">
          <Pin className="h-3.5 w-3.5 text-purple mt-0.5 shrink-0" />
          <p className="text-xs text-purple/80 leading-relaxed">{pinnedMessage.text}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageCircle className="h-8 w-8 text-gray-700 mb-2" />
            <p className="text-gray-600 text-xs">Nenhuma mensagem ainda</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.uid === user?.uid;
          const prevMsg = i > 0 ? messages[i - 1] : null;
          const isGrouped = prevMsg?.uid === msg.uid;

          return (
            <div
              key={msg.id}
              className={`group flex items-start gap-2 ${isGrouped ? "mt-0.5" : "mt-2.5"}`}
            >
              {/* Avatar */}
              {!isGrouped ? (
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarColor(msg.displayName)}`}
                >
                  {getInitials(msg.displayName)}
                </div>
              ) : (
                <div className="h-7 w-7 shrink-0" />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {!isGrouped && (
                  <p className="text-[11px] font-medium text-gray-400 mb-0.5">
                    {isMe ? "Tu" : msg.displayName}
                  </p>
                )}
                <p className="text-[13px] text-gray-200 leading-relaxed break-words">
                  {msg.text}
                </p>
              </div>

              {/* Moderation controls */}
              {isHost && !isMe && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                  <button
                    onClick={() => handlePin(msg.id)}
                    className="p-1 rounded text-gray-600 hover:text-purple hover:bg-purple/10 transition-colors"
                    title="Fixar"
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleHide(msg.id)}
                    className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Ocultar"
                  >
                    <EyeOff className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-gray-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escrever mensagem..."
            className="flex-1 bg-gray-800/80 text-[13px] text-white px-3 py-2.5 rounded-lg border border-gray-700/50 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/20 transition-colors min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple text-white hover:bg-purple-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all shrink-0 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
