"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronLeft, Users, MessageCircle, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import ChatRoom from "@/components/chat/ChatRoom";
import type { CourseChat } from "@/types/chat";

export default function ChatRoomPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const { user, isTeacher } = useAuth();

  const [chat, setChat] = useState<CourseChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    getDoc(doc(db, "courseChats", chatId))
      .then(snap => {
        if (snap.exists()) setChat({ id: snap.id, ...snap.data() } as CourseChat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
          <MessageCircle className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-700 mb-2">
          // não encontrado
        </p>
        <p className="text-sm text-gray-600 mb-4">Conversa não encontrada.</p>
        <Link
          href="/dashboard/chats"
          className="font-mono text-[10px] uppercase tracking-widest text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    );
  }

  // Outro participante (para chats individuais)
  const otherId   = chat.participants.find(p => p !== user?.uid) ?? "";
  const otherName = chat.participantNames[otherId] ?? "Chat Individual";
  const otherPhoto = chat.participantPhotos[otherId];

  const isGroup = chat.type === "group";
  const title   = isGroup ? chat.courseTitle : otherName;
  const backHref = isTeacher ? "/dashboard/teacher/chats" : "/dashboard/chats";

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col max-w-[80rem] mx-auto">

      {/* ── Header da sala ── */}
      <div className="flex items-center gap-3 border border-gray-800/60 bg-gray-900/20 px-4 py-3 shrink-0">
        {/* Voltar */}
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-gray-700 hover:text-gray-500 transition-colors shrink-0"
          aria-label="Voltar aos chats"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>

        {/* Avatar */}
        <div className="h-9 w-9 shrink-0 overflow-hidden border border-gray-800/60">
          {isGroup ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-900">
              <Users className="h-4 w-4 text-purple/70" strokeWidth={1.5} />
            </div>
          ) : (
            <Avatar uid={otherId} photoURL={otherPhoto} name={otherName} size={36} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-200 truncate">{title}</p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-gray-700 mt-0.5">
            {isGroup ? `grupo · ${chat.courseTitle}` : "chat individual"}
          </p>
        </div>

        {/* Link para o curso */}
        <Link
          href={`/dashboard/courses/${chat.courseId}`}
          className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-gray-700 hover:text-purple/70 transition-colors"
        >
          ver curso →
        </Link>
      </div>

      {/* ── Sala de mensagens ── */}
      <div className="flex-1 overflow-hidden border border-t-0 border-gray-800/60">
        <ChatRoom chatId={chatId} height="h-full" />
      </div>
    </div>
  );
}
