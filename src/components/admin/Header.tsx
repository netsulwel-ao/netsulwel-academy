"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, onSnapshot, where,
  doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { Bell, Menu, CheckCheck, Radio, CreditCard, Heart, MessageCircle, Award } from "lucide-react";
import type { AppNotification } from "@/types/notification";

interface HeaderProps {
  onMenuClick?: () => void;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  payment_approved:    <CreditCard    className="h-4 w-4 text-green-400" />,
  live_started:        <Radio         className="h-4 w-4 text-purple-400" />,
  community_like:      <Heart         className="h-4 w-4 text-red-400" />,
  community_comment:   <MessageCircle className="h-4 w-4 text-blue-400" />,
  certificate_ready:   <Award         className="h-4 w-4 text-amber-400" />,
  live_approved:       <Radio         className="h-4 w-4 text-green-400" />,
  live_rejected:       <Radio         className="h-4 w-4 text-red-400" />,
  recording_ready:     <Radio         className="h-4 w-4 text-blue-400" />,
  new_question:        <MessageCircle className="h-4 w-4 text-yellow-400" />,
  question_answered:   <MessageCircle className="h-4 w-4 text-green-400" />,
};

function getReadBroadcasts(): Set<string> {
  try {
    const raw = localStorage.getItem("admin_read_broadcasts");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function markBroadcastRead(id: string) {
  try {
    const set = getReadBroadcasts();
    set.add(id);
    localStorage.setItem("admin_read_broadcasts", JSON.stringify([...set]));
  } catch {}
}
function markAllBroadcastsRead(ids: string[]) {
  try {
    const set = getReadBroadcasts();
    ids.forEach((id) => set.add(id));
    localStorage.setItem("admin_read_broadcasts", JSON.stringify([...set]));
  } catch {}
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [broadcasts, setBroadcasts] = useState<AppNotification[]>([]);
  const [readBroadcasts, setReadBroadcasts] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadBroadcasts(getReadBroadcasts());
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      setUserNotifs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const q = query(
      collection(db, "broadcasts"),
      where("createdAt", ">=", oneDayAgo),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsub = onSnapshot(q, (snap) => {
      setBroadcasts(snap.docs.map((d) => ({
        id: `broadcast_${d.id}`,
        uid: user.uid,
        ...d.data(),
        read: false,
      } as AppNotification)));
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allNotifications: AppNotification[] = [
    ...broadcasts.map((b) => ({
      ...b,
      read: readBroadcasts.has(b.id!),
    })),
    ...userNotifs,
  ];

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    const broadcastIds = broadcasts.map((b) => b.id!);
    markAllBroadcastsRead(broadcastIds);
    setReadBroadcasts(getReadBroadcasts());
    const unreadUserNotifs = userNotifs.filter((n) => !n.read && n.id);
    if (unreadUserNotifs.length > 0) {
      try {
        const batch = writeBatch(db);
        unreadUserNotifs.forEach((n) => {
          batch.update(doc(db, "users", user.uid, "notifications", n.id!), { read: true });
        });
        await batch.commit();
      } catch (err) {
        console.error("Erro ao marcar notificações como lidas:", err);
      }
    }
  };

  const markRead = async (n: AppNotification) => {
    if (!user || !n.id) return;
    if (n.id.startsWith("broadcast_")) {
      markBroadcastRead(n.id);
      setReadBroadcasts(getReadBroadcasts());
    } else if (!n.read) {
      try {
        await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      } catch (err) {
        console.error("Erro ao marcar notificação como lida:", err);
      }
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "A";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-8 ${
      theme === "light"
        ? "bg-bg-surface border-b border-border-default shadow-sm"
        : "bg-bg-page border-b border-border-default"
    }`}>
      <div className="flex flex-1 items-center gap-4">
        <button onClick={onMenuClick} aria-label="Abrir menu de navegação" className={`lg:hidden transition-colors mr-2 ${
          theme === "light" ? "text-text-muted hover:text-text-primary" : "text-text-muted hover:text-text-primary"
        }`}>
          <Menu className="h-6 w-6" />
        </button>
        <span className={`px-2.5 py-0.5 text-sm font-bold uppercase tracking-wider hidden sm:block ${
          theme === "light"
            ? "bg-blue-50 text-blue-600 border border-blue-100"
            : "bg-blue-500/10 text-blue-400"
        }`}>
          Modo Gestão
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Notification bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`relative transition-colors ${
              theme === "light" ? "text-text-muted hover:text-text-primary" : "text-text-muted hover:text-text-primary"
            }`}
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[13px] font-bold text-text-on-brand bg-brand-purple ring-2 ${
                theme === "light" ? "ring-bg-surface" : "ring-bg-page"
              }`}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className={`absolute right-0 top-10 w-80 sm:w-96 shadow-2xl z-50 max-h-[70vh] flex flex-col ${
              theme === "light"
                ? "bg-bg-surface border border-border-default shadow-xl"
                : "bg-bg-surface border border-border-default"
            }`}>
              <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                theme === "light" ? "border-border-default" : "border-border-default"
              }`}>
                <h3 className={`text-sm font-bold ${theme === "light" ? "text-text-primary" : "text-text-primary"}`}>
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[13px] bg-brand-purple text-text-on-brand font-bold">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-sm text-brand-purple hover:text-brand-purple-on-dark font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {allNotifications.length === 0 ? (
                  <div className={`px-4 py-8 text-center text-sm ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                    Nenhuma notificação
                  </div>
                ) : (
                  allNotifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b ${
                        theme === "light"
                          ? `border-border-subtle hover:bg-hover-bg ${!n.read ? "bg-brand-purple/5" : ""}`
                          : `border-border-subtle hover:bg-hover-bg ${!n.read ? "bg-brand-purple/5" : ""}`
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center mt-0.5 ${
                        theme === "light" ? "bg-bg-surface-2" : "bg-bg-surface-2"
                      }`}>
                        {NOTIF_ICONS[n.type] || <Bell className={`h-4 w-4 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !n.read
                            ? theme === "light" ? "text-text-primary font-semibold" : "text-text-primary font-semibold"
                            : theme === "light" ? "text-text-secondary" : "text-text-secondary"
                        }`}>{n.title}</p>
                        <p className={`text-sm mt-0.5 line-clamp-2 ${
                          theme === "light" ? "text-text-muted" : "text-text-muted"
                        }`}>{n.message}</p>
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-brand-purple shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`h-7 w-px ${theme === "light" ? "bg-border-default" : "bg-border-default"}`}></div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className={`text-sm font-semibold ${theme === "light" ? "text-text-primary" : "text-text-primary"}`}>{user?.displayName || "Administrador"}</p>
            <p className={`text-sm font-medium ${theme === "light" ? "text-blue-600" : "text-blue-400"}`}>Admin</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold shadow-md">
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
