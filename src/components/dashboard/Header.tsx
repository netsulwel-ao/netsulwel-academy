"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, onSnapshot,
  doc, updateDoc, writeBatch,
} from "firebase/firestore";
import { Bell, Menu, CheckCheck, Radio, CreditCard, Heart, MessageCircle, Award, DollarSign, Mail, Video } from "lucide-react";
import Link from "next/link";
import type { AppNotification } from "@/types/notification";

interface HeaderProps {
  onMenuClick?: () => void;
  theme?: "dark" | "light";
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  payment_approved:     <CreditCard    className="h-4 w-4 text-green-400" />,
  sale_completed:       <DollarSign    className="h-4 w-4 text-green-400" />,
  fee_applied:          <DollarSign    className="h-4 w-4 text-yellow-400" />,
  live_started:         <Radio         className="h-4 w-4 text-purple-400" />,
  course_live_started:  <Radio         className="h-4 w-4 text-purple-400" />,
  community_like:       <Heart         className="h-4 w-4 text-red-400" />,
  community_comment:    <MessageCircle className="h-4 w-4 text-blue-400" />,
  certificate_ready:    <Award         className="h-4 w-4 text-amber-400" />,
  institution_invitation: <Mail         className="h-4 w-4 text-cyan-400" />,
  course_published:     <Video         className="h-4 w-4 text-purple-400" />,
};

// IDs de broadcasts já lidos guardados em localStorage (sem escrever no Firestore)
function getReadBroadcasts(): Set<string> {
  try {
    const raw = localStorage.getItem("read_broadcasts");
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function markBroadcastRead(id: string) {
  try {
    const set = getReadBroadcasts();
    set.add(id);
    localStorage.setItem("read_broadcasts", JSON.stringify([...set]));
  } catch {}
}
function markAllBroadcastsRead(ids: string[]) {
  try {
    const set = getReadBroadcasts();
    ids.forEach((id) => set.add(id));
    localStorage.setItem("read_broadcasts", JSON.stringify([...set]));
  } catch {}
}

export default function Header({ onMenuClick, theme = "dark" }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [broadcasts, setBroadcasts] = useState<AppNotification[]>([]);
  const [readBroadcasts, setReadBroadcasts] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar IDs de broadcasts lidos do localStorage na montagem
  useEffect(() => {
    setReadBroadcasts(getReadBroadcasts());
  }, []);

  // Notificações pessoais do utilizador
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

  // Broadcasts globais — últimos 20, dos últimos 30 dias
  useEffect(() => {
    if (!user) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, "broadcasts"),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(q, (snap) => {
      setBroadcasts(snap.docs.map((d) => ({
        id: `broadcast_${d.id}`,
        uid: user.uid,
        ...d.data(),
        read: false, // gerido localmente
      } as AppNotification)));
    });
    return () => unsub();
  }, [user?.uid]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Combinar notificações: broadcasts + pessoais, ordenadas por data
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

    // Marcar broadcasts lidos localmente
    const broadcastIds = broadcasts.map((b) => b.id!);
    markAllBroadcastsRead(broadcastIds);
    setReadBroadcasts(getReadBroadcasts());

    // Marcar notificações pessoais no Firestore via batch
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
      // Broadcast: guardar em localStorage
      markBroadcastRead(n.id);
      setReadBroadcasts(getReadBroadcasts());
    } else if (!n.read) {
      // Notificação pessoal: marcar no Firestore
      try {
        await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true });
      } catch (err) {
        console.error("Erro ao marcar notificação como lida:", err);
      }
    }

    // Navegar sem reload completo
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
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
        <button
          onClick={onMenuClick}
          className={`lg:hidden transition-colors mr-2 ${
            theme === "light" ? "text-slate-400 hover:text-slate-800" : "text-gray-400 hover:text-white"
          }`}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* ── Notification bell ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`relative transition-colors ${
              theme === "light" ? "text-slate-400 hover:text-slate-700" : "text-gray-400 hover:text-white"
            }`}
            aria-label="Notificações"
          >
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
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                theme === "light" ? "border-slate-200" : "border-gray-800"
              }`}>
                <h3 className={`text-sm font-bold ${theme === "light" ? "text-slate-800" : "text-white"}`}>
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-purple-600 text-white font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas lidas
                  </button>
                )}
              </div>

              {/* List */}
              <div className="overflow-y-auto flex-1">
                {allNotifications.length === 0 ? (
                  <div className={`px-4 py-8 text-center text-sm ${theme === "light" ? "text-slate-400" : "text-gray-500"}`}>
                    Nenhuma notificação
                  </div>
                ) : (
                  allNotifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => markRead(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b ${
                        theme === "light"
                          ? `border-slate-100 hover:bg-slate-50 ${!n.read ? "bg-purple-50/50" : ""}`
                          : `border-gray-800/40 hover:bg-gray-800/60 ${!n.read ? "bg-purple-500/5" : ""}`
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center mt-0.5 ${
                        theme === "light" ? "bg-slate-100" : "bg-gray-800"
                      }`}>
                        {NOTIF_ICONS[n.type] || <Bell className={`h-4 w-4 ${theme === "light" ? "text-slate-400" : "text-gray-400"}`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          !n.read
                            ? theme === "light" ? "text-slate-900 font-semibold" : "text-white font-semibold"
                            : theme === "light" ? "text-slate-600" : "text-gray-300"
                        }`}>{n.title}</p>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${
                          theme === "light" ? "text-slate-400" : "text-gray-500"
                        }`}>{n.message}</p>
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0 mt-2" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className={`h-7 w-px ${theme === "light" ? "bg-slate-200" : "bg-gray-800"}`} />

        {/* ── User info ── */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className={`text-sm font-semibold ${theme === "light" ? "text-slate-800" : "text-white"}`}>
              {user?.displayName || "Utilizador"}
            </p>
            <p className={`text-xs ${theme === "light" ? "text-slate-400" : "text-gray-500"}`}>
              {user?.email}
            </p>
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
