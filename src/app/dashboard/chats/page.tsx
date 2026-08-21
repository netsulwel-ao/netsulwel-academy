"use client";

import { MessageCircle } from "lucide-react";
import ChatList from "@/components/chat/ChatList";

export default function ChatsPage() {
  return (
    <div className="max-w-[80rem] mx-auto space-y-6 animate-in fade-in duration-300">

      {/* ── Cabeçalho ── */}
      <div>
        <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/60 mb-2">
          // mensagens
        </p>
        <h1 className="text-2xl font-bold text-gray-100">Chats</h1>
        <p className="mt-1 text-sm text-gray-600">
          Conversas de grupo e mensagens individuais dos teus cursos.
        </p>
      </div>

      {/* ── Lista de conversas ── */}
      <div className="border border-gray-800 bg-gray-900">
        <ChatList />
      </div>
    </div>
  );
}
