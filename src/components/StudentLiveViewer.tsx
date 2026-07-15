"use client";

import { useEffect, useState, useRef } from "react";
import {
  Send, MessageSquare, Radio, Loader2,
  AlertTriangle, Hand, Volume2, X, Menu, Users,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, deleteDoc, doc,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { LiveSession, ChatMessage } from "@/types/live";

interface StudentLiveViewerProps {
  live: LiveSession;
  videoElement: React.ReactNode;
  participantCount?: number;
}

// ── Chat Component ──
function StudentChat({ liveId }: { liveId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "lives", liveId, "chat"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
        .filter(m => !m.hidden)); // Não mostrar mensagens ocultas
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [liveId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || loading) return;
    
    setLoading(true);
    try {
      const msg = text.trim();
      setText("");
      await addDoc(collection(db, "lives", liveId, "chat"), {
        liveId,
        uid: user.uid,
        displayName: user.displayName || "Aluno",
        photoURL: user.photoURL || "",
        text: msg,
        type: "message",
        createdAt: serverTimestamp(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] border border-white/8 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-white/8 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-white/60" />
        <span className="text-xs sm:text-sm font-semibold text-white/80">Chat Ao Vivo</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <MessageSquare className="h-8 w-8 text-white/10" />
            <p className="text-xs text-white/20">Nenhuma mensagem ainda</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-xs">
              {msg.type === "hand_raise" ? (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded">
                  <Hand className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300">{msg.displayName}</span>
                  <span className="text-white/40">pediu a palavra</span>
                </div>
              ) : msg.type === "system" ? (
                <div className="text-center text-white/20 italic py-1">{msg.text}</div>
              ) : (
                <div className="flex gap-2">
                  <span className="font-semibold text-white/60 shrink-0 line-clamp-1">
                    {msg.displayName}
                  </span>
                  <span className="text-white/70 break-words flex-1">{msg.text}</span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="px-3 sm:px-4 py-3 border-t border-white/8 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escrever mensagem..."
          disabled={loading}
          className="flex-1 bg-white/5 border border-white/10 px-2.5 py-1.5 text-xs sm:text-sm text-white placeholder-white/25 rounded focus:outline-none focus:border-white/25 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="flex items-center justify-center h-8 w-8 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/20 text-white rounded transition-colors disabled:cursor-not-allowed"
          title="Enviar"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}

// ── Hand Raise ──
function HandRaiseButton({ liveId }: { liveId: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const raiseHand = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "lives", liveId, "handraises"), {
        uid: user.uid,
        name: user.displayName || "Aluno",
        createdAt: serverTimestamp(),
      });
      // Adicionar mensagem no chat
      await addDoc(collection(db, "lives", liveId, "chat"), {
        liveId,
        uid: user.uid,
        displayName: user.displayName || "Aluno",
        text: "levantou a mão",
        type: "hand_raise",
        createdAt: serverTimestamp(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={raiseHand}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-white/10 text-white font-semibold text-xs sm:text-sm rounded transition-colors disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          A pedir...
        </>
      ) : (
        <>
          <Hand className="h-4 w-4" />
          Pedir Palavra
        </>
      )}
    </button>
  );
}

// ── Main Component ──
export function StudentLiveViewer({
  live,
  videoElement,
  participantCount = 0,
}: StudentLiveViewerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0a0a0c] gap-0 md:gap-3 p-0 md:p-3">
      {/* Video Area */}
      <div className="flex-1 flex flex-col min-h-0 md:rounded-lg overflow-hidden bg-black border-0 md:border border-white/8">
        {/* Header */}
        <div className="h-10 md:h-11 bg-[#0e0e11] border-b border-white/8 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Radio className="h-3.5 w-3.5 text-white/30 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-white/80 truncate">
              {live.title}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-red-600/15 border border-red-500/20 px-2 py-0.5 rounded shrink-0">
            <span className="w-1.5 h-1.5 bg-red-500 animate-pulse" />
            <span className="text-[11px] font-bold text-red-400">AO VIVO</span>
          </div>

          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{participantCount}</span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Video */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {videoElement}
        </div>

        {/* Actions - Bottom on Mobile */}
        <div className="md:hidden px-3 py-2 space-y-2 bg-[#0e0e11] border-t border-white/8 shrink-0">
          <HandRaiseButton liveId={live.id!} />
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            {showChat ? "Fechar Chat" : "Abrir Chat"}
          </button>
        </div>
      </div>

      {/* Sidebar - Chat & Info */}
      <div
        className={`
          fixed md:relative bottom-0 left-0 right-0 md:static
          bg-[#0a0a0c] md:bg-transparent
          border-t md:border-0 border-white/8
          h-[40vh] md:h-full
          transition-all duration-300
          ${sidebarOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"}
          md:w-80 lg:w-96
          flex flex-col
          rounded-t-lg md:rounded-lg
          overflow-hidden
          z-40
        `}
      >
        {/* Tabs - Mobile Only */}
        <div className="md:hidden flex border-b border-white/8 shrink-0">
          <button
            onClick={() => setShowChat(true)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              showChat
                ? "text-white border-b-2 border-white bg-white/[3%]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setShowChat(false)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              !showChat
                ? "text-white border-b-2 border-white bg-white/[3%]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Informações
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {showChat || !sidebarOpen ? (
            <StudentChat liveId={live.id!} />
          ) : (
            <div className="p-3 sm:p-4 space-y-4 overflow-y-auto h-full">
              {/* Live Info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
                  Informações
                </p>
                <p className="text-sm text-white/70 leading-relaxed">
                  {live.description}
                </p>
              </div>

              {/* Participants */}
              <div className="pt-2 border-t border-white/8 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/30">
                  Conectados
                </p>
                <p className="text-sm font-mono text-white/60">
                  {participantCount} participante{participantCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden on mobile, shown on desktop */}
        <div className="hidden md:flex flex-col gap-2 p-4 border-t border-white/8 bg-[#0e0e11] shrink-0">
          <HandRaiseButton liveId={live.id!} />
        </div>
      </div>
    </div>
  );
}
