"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { sendMessage, listenMessages, markChatAsRead } from "@/lib/chat";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/chat";

// ── Helper: timestamp → hora legível ──────────────────────────
function fmtMsgTime(raw: unknown): string {
  if (!raw) return "";
  const d: Date | null =
    raw instanceof Date ? raw :
    (typeof raw === "object" && "toDate" in (raw as object))
      ? (raw as { toDate: () => Date }).toDate()
      : null;
  if (!d) return "";
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

// ── Bolha de mensagem ─────────────────────────────────────────
interface BubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  showSender: boolean; // mostrar nome quando há mensagens consecutivas do mesmo utilizador
}

function Bubble({ msg, isMe, showSender }: BubbleProps) {
  if (msg.type === "system") {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700 shrink-0">
          {msg.text}
        </span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {/* Avatar — só para mensagens de outros */}
      {!isMe && (
        <div className="h-7 w-7 shrink-0 overflow-hidden border border-gray-800 mb-0.5">
          <Avatar uid={msg.uid} photoURL={msg.photoURL} name={msg.displayName} size={28} />
        </div>
      )}

      <div className={`max-w-[72%] sm:max-w-[60%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        {showSender && !isMe && (
          <span className="font-mono text-[13px] uppercase tracking-widest text-gray-700 ml-1">
            {msg.displayName}
          </span>
        )}

        <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${
          isMe
            ? "bg-purple text-white"
            : "border border-gray-800 bg-gray-900 text-gray-200"
        }`}>
          {msg.text}
        </div>

        <span className="font-mono text-[13px] text-gray-700 mx-1">
          {fmtMsgTime(msg.createdAt)}
        </span>
      </div>

      {/* Espaço onde ficaria avatar do lado direito — mantém alinhamento */}
      {isMe && <div className="w-7 shrink-0" />}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────
interface ChatRoomProps {
  chatId: string;
  height?: string;
}

export default function ChatRoom({ chatId, height = "h-full" }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Listener em tempo real
  useEffect(() => {
    const unsub = listenMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  // Marcar como lido ao abrir o chat
  useEffect(() => {
    if (!user) return;
    markChatAsRead(chatId, user.uid).catch(() => {});
  }, [chatId, user?.uid]);

  // Toast quando chega mensagem de outro utilizador
  const prevCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevCountRef.current && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.uid !== user?.uid && lastMsg.type === "text") {
        toast.info(`${lastMsg.displayName}: ${lastMsg.text.slice(0, 60)}${lastMsg.text.length > 60 ? "..." : ""}`, {
          duration: 5000,
        });
      }
    }
    prevCountRef.current = messages.length;
  }, [messages, user?.uid]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || sending) return;
    setError("");
    setSending(true);
    try {
      await sendMessage(
        chatId,
        user.uid,
        user.displayName ?? "Utilizador",
        user.photoURL ?? undefined,
        text.trim()
      );
      setText("");
    } catch (err) {
      logger.error("ChatRoom: failed to send message", err, { chatId });
      setError("Não foi possível enviar. Tenta novamente.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [chatId, text, user, sending]);

  // Determinar se deve mostrar o nome do remetente
  // (só quando muda de remetente ou após mensagem do sistema)
  const showSender = (i: number): boolean => {
    if (i === 0) return true;
    const prev = messages[i - 1];
    const curr = messages[i];
    return prev.uid !== curr.uid || prev.type === "system";
  };

  return (
    <div className={`flex flex-col ${height}`}>
      {/* ── Mensagens ── */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2 bg-gray-950">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
              <MessageCircle className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
            </div>
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem mensagens</p>
            <p className="text-sm text-gray-600">Sê o primeiro a enviar uma mensagem.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <Bubble
            key={msg.id}
            msg={msg}
            isMe={msg.uid === user?.uid}
            showSender={showSender(i)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Erro de envio ── */}
      {error && (
        <div className="px-4 py-2 bg-red-500/8 border-t border-red-500">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Input ── */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 sm:gap-2 px-3 sm:px-3 py-3 border-t border-gray-800 bg-gray-950 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); setError(""); }}
          placeholder="Escreve uma mensagem..."
          disabled={sending}
          maxLength={1000}
          className="flex-1 border border-gray-800 bg-gray-900 py-2.5 px-3 text-sm text-gray-200 focus:border-purple focus:outline-none disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center bg-purple hover:bg-purple-light text-white transition-colors disabled:opacity-40"
          aria-label="Enviar mensagem"
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </form>
    </div>
  );
}
