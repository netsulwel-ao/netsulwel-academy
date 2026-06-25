"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDashboardTheme } from "@/hooks/useDashboardTheme";
import ChatRoom from "@/components/chat/ChatRoom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, MessageCircle, Users, User, Loader2 } from "lucide-react";
import Link from "next/link";
import type { CourseChat } from "@/types/chat";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useDashboardTheme();
  const chatId = params?.chatId as string;
  const [chat, setChat] = useState<CourseChat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId) return;
    const ref = doc(db, "courseChats", chatId);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setChat({ id: snap.id, ...snap.data() } as CourseChat);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="h-6 w-6 animate-spin text-purple" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className={`flex flex-col items-center justify-center py-20 text-center ${theme === "light" ? "text-gray-400" : "text-gray-600"}`}>
        <MessageCircle className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm font-medium">Conversa não encontrada</p>
        <Link href="/dashboard/chats" className="mt-4 text-sm text-purple hover:text-purple-light">
          Voltar aos chats
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${theme === "light" ? "text-gray-900" : "text-gray-100"}`}>
      <div className={`flex items-center gap-3 px-4 py-3 border-b shrink-0 ${
        theme === "light" ? "border-gray-200 bg-white" : "border-gray-800 bg-gray-950/40"
      }`}>
        <button onClick={() => router.back()} className={`transition-colors mr-1 ${
          theme === "light" ? "text-gray-400 hover:text-gray-700" : "text-gray-500 hover:text-gray-300"
        }`}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${
          chat.type === "group"
            ? theme === "light" ? "bg-purple/10 text-purple" : "bg-purple/20 text-purple"
            : theme === "light" ? "bg-green-500/10 text-green-600" : "bg-green-500/20 text-green-400"
        }`}>
          {chat.type === "group" ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">{chat.type === "group" ? chat.courseTitle : "Chat Individual"}</p>
          <p className={`text-[11px] ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>
            {chat.type === "group" ? "Chat do curso" : "Professor-Aluno"} &middot; {chat.courseTitle}
          </p>
        </div>
        <Link href={`/dashboard/courses/${chat.courseId}`} className={`text-xs font-medium transition-colors ${
          theme === "light" ? "text-purple hover:text-purple-dark" : "text-purple hover:text-purple-light"
        }`}>
          Ver curso
        </Link>
      </div>

      <ChatRoom chatId={chatId} theme={theme} height="flex-1 h-[calc(100vh-16rem)]" />
    </div>
  );
}
