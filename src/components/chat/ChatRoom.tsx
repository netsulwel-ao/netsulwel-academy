"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { sendMessage, listenMessages } from "@/lib/chat";
import { Send, Loader2, MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/types/chat";

interface ChatRoomProps {
  chatId: string;
  theme?: "dark" | "light";
  height?: string;
}

export default function ChatRoom({ chatId, theme = "dark", height = "h-full" }: ChatRoomProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = listenMessages(chatId, setMessages);
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, user.uid, user.displayName || "Utilizador", user.photoURL || undefined, text.trim());
      setText("");
    } catch { }
    setSending(false);
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col ${height}`}>
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${theme === "light" ? "bg-gray-50" : "bg-gray-950/60"}`}>
        {messages.length === 0 && (
          <div className={`flex flex-col items-center justify-center h-full text-center ${theme === "light" ? "text-gray-400" : "text-gray-600"}`}>
            <MessageCircle className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.uid === user?.uid;
          const isSystem = msg.type === "system";
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {isSystem ? (
                <div className={`text-xs text-center italic w-full py-2 ${theme === "light" ? "text-gray-400" : "text-gray-600"}`}>
                  {msg.text}
                </div>
              ) : (
                <div className={`max-w-[75%] ${isMe ? "order-1" : "order-1"}`}>
                  {!isMe && (
                    <p className={`text-[11px] font-medium mb-1 ml-1 ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>
                      {msg.displayName}
                    </p>
                  )}
                  <div className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? theme === "light"
                        ? "bg-purple text-white rounded-tl-lg rounded-br-lg rounded-bl-lg"
                        : "bg-purple text-white rounded-tl-lg rounded-br-lg rounded-bl-lg"
                      : theme === "light"
                        ? "bg-white border border-gray-200 text-gray-800 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                        : "bg-gray-800/70 text-gray-200 rounded-tr-lg rounded-br-lg rounded-bl-lg"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className={`flex items-center gap-2 p-3 border-t shrink-0 ${
        theme === "light" ? "border-gray-200 bg-white" : "border-gray-800 bg-gray-950/40"
      }`}>
        <input ref={inputRef} type="text" value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Escreva uma mensagem..."
          disabled={sending}
          className={`flex-1 border py-2.5 px-4 text-sm transition-colors focus:outline-none disabled:opacity-50 ${
            theme === "dark"
              ? "border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:border-purple focus:ring-1 focus:ring-purple"
              : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:border-purple focus:ring-1 focus:ring-purple"
          }`} />
        <button type="submit" disabled={!text.trim() || sending}
          className="flex items-center justify-center h-10 w-10 bg-purple hover:bg-purple-light text-white transition-colors disabled:opacity-50 shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
