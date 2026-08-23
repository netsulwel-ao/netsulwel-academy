"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Users, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listenUserChats, markChatAsRead } from "@/lib/chat";
import { Avatar } from "@/components/ui/Avatar";
import type { CourseChat } from "@/types/chat";

// ── Helper: formatar timestamp ────────────────────────────────
function fmtTime(raw: unknown): string {
  if (!raw) return "";
  const d: Date | null =
    raw instanceof Date ? raw :
    (typeof raw === "object" && "toDate" in (raw as object))
      ? (raw as { toDate: () => Date }).toDate()
      : null;
  if (!d) return "";
  const diff = Date.now() - d.getTime();
  if (diff < 86_400_000) return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604_800_000) return d.toLocaleDateString("pt-PT", { weekday: "short" });
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

// ── Avatar de chat ────────────────────────────────────────────
function ChatAvatar({ chat, currentUid }: { chat: CourseChat; currentUid: string }) {
  if (chat.type === "group") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-gray-800 bg-gray-900">
        <Users className="h-4 w-4 text-purple" strokeWidth={1.5} />
      </div>
    );
  }

  const otherId = chat.participants.find(p => p !== currentUid) ?? "";
  const photo   = otherId ? chat.participantPhotos[otherId] : undefined;
  const name    = otherId ? chat.participantNames[otherId]  : "";

  return (
    <div className="h-10 w-10 shrink-0 overflow-hidden border border-gray-800">
      <Avatar uid={otherId} photoURL={photo} name={name} size={40} />
    </div>
  );
}

// ── Item de chat ──────────────────────────────────────────────
interface ChatItemProps {
  chat: CourseChat;
  currentUid: string;
  href: string;
  onSelect?: (chatId: string) => void;
}

function ChatItem({ chat, currentUid, href, onSelect }: ChatItemProps) {
  const otherId   = chat.participants.find(p => p !== currentUid) ?? "";
  const otherName = chat.participantNames[otherId] ?? "Chat Individual";
  const displayName = chat.type === "group" ? chat.courseTitle : otherName;
  const lastMsgPrefix =
    chat.lastMessageBy && chat.lastMessageBy !== currentUid && chat.lastMessageByName
      ? `${chat.lastMessageByName}: `
      : "";
  const unread = chat.unreadBy?.[currentUid] ?? 0;

  const content = (
    <>
      <ChatAvatar chat={chat} currentUid={currentUid} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold truncate ${unread > 0 ? "text-white" : "text-gray-200"}`}>{displayName}</p>
          <span className="shrink-0 font-mono text-[13px] text-gray-700">
            {fmtTime(chat.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {chat.type === "group" && (
            <span className="font-mono text-[13px] uppercase tracking-widest border border-purple bg-purple/8 text-purple px-1.5 py-px shrink-0">
              grupo
            </span>
          )}
          <p className={`text-sm truncate ${unread > 0 ? "text-gray-300 font-medium" : "text-gray-600"}`}>
            {lastMsgPrefix}{chat.lastMessage ?? "Sem mensagens ainda"}
          </p>
        </div>
        {chat.type === "group" && (
          <p className="text-[13px] font-mono text-gray-700 mt-0.5 truncate">
            {chat.courseTitle}
          </p>
        )}
      </div>

      {unread > 0 && (
        <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full shrink-0">
          {unread > 99 ? "99+" : unread}
        </span>
      )}

      {unread === 0 && (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-800 group-hover:text-gray-600 transition-colors" />
      )}
    </>
  );

  const cls = "group flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 hover:bg-gray-900 transition-colors";

  const handleClick = () => {
    if (unread > 0) {
      markChatAsRead(href.split("/").pop() ?? "", currentUid).catch(() => {});
    }
  };

  if (onSelect) {
    return (
      <button type="button" onClick={() => { handleClick(); onSelect(chat.id!); }} className={`w-full text-left ${cls}`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={cls}>
      {content}
    </Link>
  );
}

// ── Componente principal ──────────────────────────────────────
interface ChatListProps {
  courseId?: string;
  onSelect?: (chatId: string) => void;
  linkPrefix?: string;
}

export default function ChatList({ courseId, onSelect, linkPrefix = "/dashboard/chats" }: ChatListProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<CourseChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const unsub = listenUserChats(user.uid, (list) => {
      if (!cancelled) { setChats(list); setLoading(false); }
    });
    return () => { cancelled = true; unsub(); };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = courseId ? chats.filter(c => c.courseId === courseId) : chats;
  const groups   = filtered.filter(c => c.type === "group");
  const indivs   = filtered.filter(c => c.type === "individual");

  if (loading) return null;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center border border-gray-800 bg-gray-900">
          <MessageCircle className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
        </div>
        <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700 mb-2">// sem conversas</p>
        <p className="text-sm text-gray-600">
          {courseId
            ? "Ainda não há conversas neste curso."
            : "As conversas de grupo e individuais aparecem aqui."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Grupos */}
      {groups.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// grupos · {groups.length}</p>
          </div>
          {groups.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              currentUid={user?.uid ?? ""}
              href={`${linkPrefix}/${chat.id}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      {/* Individuais */}
      {indivs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
            <p className="font-mono text-[13px] uppercase tracking-widest text-gray-700">// individuais · {indivs.length}</p>
          </div>
          {indivs.map(chat => (
            <ChatItem
              key={chat.id}
              chat={chat}
              currentUid={user?.uid ?? ""}
              href={`${linkPrefix}/${chat.id}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
