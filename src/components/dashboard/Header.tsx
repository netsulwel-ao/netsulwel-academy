"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Bell, Menu, X, CheckCheck, Radio, CreditCard, Heart, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import type { AppNotification } from "@/types/notification";

interface HeaderProps {
  onMenuClick?: () => void;
  theme?: "dark" | "light";
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  payment_approved: <CreditCard className="h-4 w-4 text-green-400" />,
  live_started: <Radio className="h-4 w-4 text-purple-400" />,
  course_live_started: <Radio className="h-4 w-4 text-purple-400" />,
  community_like: <Heart className="h-4 w-4 text-red-400" />,
  community_comment: <MessageCircle className="h-4 w-4 text-blue-400" />,
};

export default function Header({ onMenuClick, theme = "dark" }: HeaderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const userNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications((prev) => {
        const broadcasts = prev.filter((n) => n.id?.startsWith("broadcast_"));
        return [...broadcasts, ...userNotifs];
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const broadcasts = snap.docs.map((d) => ({
        id: `broadcast_${d.id}`,
        uid: user.uid,
        ...d.data(),
        read: false,
      } as AppNotification));
      setNotifications((prev) => {
        const userNotifs = prev.filter((n) => !n.id?.startsWith("broadcast_"));
        return [...broadcasts, ...userNotifs];
      });
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read && n.id);
    await Promise.all(unread.map((n) => updateDoc(doc(db, "users", user.uid, "notifications", n.id!), { read: true })));
  };

  const markRead = async (n: AppNotification) => {
    if (!user || !n.id || n.read) return;
    await updateDoc(doc(db, "users", user.uid, "notifications", n.id!), { read: true });
    if (n.link) window.location.href = n.link;
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-8 backdrop-blur-xl ${
      theme === "light"
        ? "bg-white/95 border-b border-slate-200 shadow-sm"
        : "bg-gray-950/80"
    }`}>
      <div className="flex flex-1 items-center gap-4">
        <button onClick={onMenuClick} className={`lg:hidden transition-colors mr-2 ${
          theme === "light" ? "text-slate-400 hover:text-slate-800" : "text-gray-400 hover:text-white"
        }`}>
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setOpen(!open)} className={`relative transition-colors ${
            theme === "light" ? "text-slate-400 hover:text-slate-700" : "text-gray-400 hover:text-white"
          }`}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-purple-600 ring-2 ${
                theme === "light" ? "ring-white" : "ring-gray-950"
              }`}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className={`absolute right-0 top-10 w-80 sm:w-96 shadow-2xl z-50 max-h-[70vh] flex flex-col ${
              theme === "light"
                ? "bg-white border border-slate-200 shadow-xl"
                : "bg-gray-900 border border-gray-800"
            }`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                theme === "light" ? "border-slate-200" : "border-gray-800"
              }`}>
                <h3 className={`text-sm font-bold ${theme === "light" ? "text-slate-800" : "text-white"}`}>Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 font-medium">
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className={`px-4 py-8 text-center text-sm ${theme === "light" ? "text-slate-400" : "text-gray-500"}`}>Nenhuma notificação</div>
                ) : (
                  notifications.map((n) => (
                    <button key={n.id} onClick={() => markRead(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b ${
                        theme === "light"
                          ? `border-slate-100 hover:bg-slate-50 ${!n.read ? "bg-purple-50/50" : ""}`
                          : `border-gray-800/40 hover:bg-gray-800/60 ${!n.read ? "bg-purple-500/5" : ""}`
                      }`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center mt-0.5 ${
                        theme === "light" ? "bg-slate-100" : "bg-gray-800"
                      }`}>
                        {NOTIF_ICONS[n.type] || <Bell className={`h-4 w-4 ${theme === "light" ? "text-slate-400" : "text-gray-400"}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read
                          ? theme === "light" ? "text-slate-900 font-semibold" : "text-white font-semibold"
                          : theme === "light" ? "text-slate-600" : "text-gray-300"
                        }`}>{n.title}</p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${theme === "light" ? "text-slate-400" : "text-gray-500"}`}>{n.message}</p>
                      </div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-2" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`h-7 w-px ${theme === "light" ? "bg-slate-200" : "bg-gray-800"}`}></div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-white"}`}>{user?.displayName || "Utilizador"}</p>
            <p className={`text-xs ${theme === "light" ? "text-slate-400" : "text-gray-500"}`}>{user?.email}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center bg-gradient-to-br from-purple to-purple-dark text-white text-sm font-bold shadow-md">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              getInitials(user?.displayName)
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
