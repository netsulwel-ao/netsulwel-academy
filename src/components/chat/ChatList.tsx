"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenUserChats } from "@/lib/chat";
import { MessageCircle, Users, User, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import type { CourseChat } from "@/types/chat";

interface ChatListProps {
  theme?: "dark" | "light";
  courseId?: string;
  onSelect?: (chatId: string) => void;
  linkPrefix?: string;
}

export default function ChatList({ theme = "dark", courseId, onSelect, linkPrefix = "/dashboard/chats" }: ChatListProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<CourseChat[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenUserChats(user.uid, setChats);
    return () => unsub();
  }, [user?.uid]);

  const filtered = courseId ? chats.filter((c) => c.courseId === courseId) : chats;

  const groupChats = filtered.filter((c) => c.type === "group");
  const individualChats = filtered.filter((c) => c.type === "individual");

  const formatTime = (date: Date | undefined) => {
    if (!date) return "";
    const d = date instanceof Date ? date : (date as any).toDate?.();
    if (!d) return "";
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString("pt-PT", { weekday: "short" });
    return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
  };

  if (filtered.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-center ${theme === "light" ? "text-gray-400" : "text-gray-600"}`}>
        <MessageCircle className="h-12 w-12 mb-4 opacity-40" />
        <p className="text-sm font-medium">Nenhuma conversa</p>
        <p className="text-xs mt-1">As conversas de grupo e individuais aparecerão aqui</p>
      </div>
    );
  }

  function renderChatList(title: string, icon: React.ReactNode, items: CourseChat[]) {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <div className={`flex items-center gap-2 px-4 mb-2 ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>
          {icon}
          <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
          <span className="text-[10px] opacity-60">({items.length})</span>
        </div>
        <div className="space-y-0.5">
          {items.map((chat) => {
            const otherParticipantId = chat.participants.find((p) => p !== user?.uid);
            const otherName = otherParticipantId ? chat.participantNames[otherParticipantId] : "";
            return (
              <div key={chat.id}>
                {onSelect ? (
                  <button onClick={() => onSelect(chat.id!)} className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-900"
                  }`}>
                    {renderAvatar(chat, otherParticipantId)}
                    {renderChatInfo(chat, otherName, formatTime)}
                  </button>
                ) : (
                  <Link href={`${linkPrefix}/${chat.id}`} className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    theme === "light" ? "hover:bg-gray-100" : "hover:bg-gray-900"
                  }`}>
                    {renderAvatar(chat, otherParticipantId)}
                    {renderChatInfo(chat, otherName, formatTime)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderAvatar(chat: CourseChat, otherParticipantId?: string) {
    if (chat.type === "group") {
      return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${theme === "light" ? "bg-purple/10 text-purple" : "bg-purple/20 text-purple"}`}>
          <Users className="h-5 w-5" />
        </div>
      );
    }
    const photo = otherParticipantId ? chat.participantPhotos[otherParticipantId] : undefined;
    if (photo) {
      return <img src={photo} alt="" className="h-10 w-10 shrink-0 object-cover" />;
    }
    return (
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center ${theme === "light" ? "bg-green-500/10 text-green-600" : "bg-green-500/20 text-green-400"}`}>
        <User className="h-5 w-5" />
      </div>
    );
  }

  function renderChatInfo(chat: CourseChat, otherName: string, fmt: (d: Date | undefined) => string) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium truncate ${theme === "light" ? "text-gray-900" : "text-gray-200"}`}>
            {chat.type === "group" ? chat.courseTitle : otherName || "Chat Individual"}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {chat.lastMessageAt && (
              <span className={`text-[10px] ${theme === "light" ? "text-gray-400" : "text-gray-600"}`}>
                {fmt(chat.lastMessageAt)}
              </span>
            )}
            <ChevronRight className={`h-3.5 w-3.5 ${theme === "light" ? "text-gray-300" : "text-gray-700"}`} />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {chat.type === "group" && (
            <span className={`text-[10px] font-medium ${theme === "light" ? "text-purple/60" : "text-purple/50"}`}>
              Grupo
            </span>
          )}
          <p className={`text-xs truncate ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}>
            {chat.lastMessageByName && chat.lastMessageBy !== user?.uid ? `${chat.lastMessageByName}: ` : ""}
            {chat.lastMessage || "Sem mensagens ainda"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {renderChatList("Grupos", <Users className="h-3.5 w-3.5" />, groupChats)}
      {renderChatList("Individuais", <User className="h-3.5 w-3.5" />, individualChats)}
    </div>
  );
}
