"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection, query, orderBy, limit, onSnapshot, getDocs, where,
  doc, updateDoc, writeBatch,
} from "firebase/firestore";

import { Bell, Menu, CheckCheck, Radio, CreditCard, Heart, MessageCircle, Award, DollarSign, Mail, Video, Building2, Settings, Search, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import type { AppNotification } from "@/types/notification";
import { Avatar } from "@/components/ui/Avatar";

interface HeaderProps {
  onMenuClick?: () => void;
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

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, isInstitution, institutionId } = useAuth();
  const { theme } = useTheme();
  const [institutionName, setInstitutionName] = useState("");

  useEffect(() => {
    if (!institutionId) return;
    const unsub = onSnapshot(doc(db, "institutions", institutionId), snap => {
      if (snap.exists()) setInstitutionName(snap.data().name || "");
    });
    return () => unsub();
  }, [institutionId]);
  const router = useRouter();
  const [userNotifs, setUserNotifs] = useState<AppNotification[]>([]);
  const [broadcasts, setBroadcasts] = useState<AppNotification[]>([]);
  const [readBroadcasts, setReadBroadcasts] = useState<Set<string>>(() => getReadBroadcasts());
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Ctrl+K search shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  // AI-powered search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const aiRes = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const { terms } = await aiRes.json();
      const snap = await getDocs(query(collection(db, "courses"), where("status", "==", "published")));
      const allCourses = snap.docs.map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>));
      const lower = q.toLowerCase().trim();
      const scored = allCourses.map((c) => {
        const title = (c.title as string)?.toLowerCase() || "";
        const desc = (c.description as string)?.toLowerCase() || "";
        const tags = ((c.tags as string[]) || []).join(" ").toLowerCase();
        const cat = (c.category as string)?.toLowerCase() || "";
        let score = 0;
        if (title.includes(lower)) score += 10;
        for (const term of terms) {
          const t = term.toLowerCase();
          if (title.includes(t)) score += 5;
          if (tags.includes(t)) score += 3;
          if (cat.includes(t)) score += 3;
          if (desc.includes(t)) score += 1;
        }
        return { course: c, score };
      });
      const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6).map((s) => s.course);
      setSearchResults(matches);
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, doSearch]);

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

  return (
    <>
    <header className={`sticky top-0 z-30 shrink-0 flex h-16 items-center justify-between px-4 sm:px-8 backdrop-blur-xl ${
      theme === "light"
        ? "bg-bg-surface/95 border-b border-border-default shadow-sm"
        : "bg-bg-surface/80 border-b border-border-default"
    }`}>
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={onMenuClick}
          aria-label="Abrir menu de navegação"
          className={`lg:hidden transition-colors mr-2 ${
            theme === "light" ? "text-text-muted hover:text-text-primary" : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Menu className="h-6 w-6" />
        </button>

        <button
          onClick={() => { setSearchOpen(true); setTimeout(() => searchInputRef.current?.focus(), 50); }}
          className={`flex items-center gap-2 h-9 px-3 border transition-colors text-sm ${
            theme === "light"
              ? "border-border-default text-text-muted hover:border-border-strong hover:text-text-primary"
              : "border-border-default text-text-muted hover:border-border-strong hover:text-text-primary"
          }`}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Pesquisar</span>
          <span className={`hidden sm:inline ml-4 text-[11px] font-mono ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>Ctrl+K</span>
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* ── Notification bell ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className={`relative transition-colors ${
              theme === "light" ? "text-text-primary hover:text-text-secondary" : "text-text-muted hover:text-text-primary"
            }`}
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-text-on-brand bg-brand-purple ring-2 ${
                theme === "light" ? "ring-bg-surface" : "ring-bg-page"
              }`}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className={`fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-10 w-auto sm:w-96 shadow-2xl z-50 max-h-[70vh] flex flex-col ${
              theme === "light"
                ? "bg-bg-surface border border-border-default shadow-xl"
                : "bg-bg-surface border border-border-default"
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
                theme === "light" ? "border-border-default" : "border-border-default"
              }`}>
                <h3 className={`text-sm font-bold ${theme === "light" ? "text-text-primary" : "text-text-primary"}`}>
                  Notificações
                  {unreadCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-brand-purple text-text-on-brand font-bold rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-on-dark font-medium"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas lidas
                  </button>
                )}
              </div>

              {/* List */}
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
                        <p className={`text-xs mt-0.5 line-clamp-2 ${
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

        <div className={`h-7 w-px ${theme === "light" ? "bg-border-default" : "bg-border-default"}`} />

        {/* ── User info + Settings ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            {isInstitution ? (
              <>
                <p className={`text-sm font-semibold ${theme === "light" ? "text-text-primary" : "text-text-primary"}`}>
                  {institutionName || user?.displayName || "Instituição"}
                </p>
                <p className={`text-xs ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                  {user?.email}
                </p>
              </>
            ) : (
              <>
                <p className={`text-sm font-semibold ${theme === "light" ? "text-text-primary" : "text-text-primary"}`}>
                  {user?.displayName || "Utilizador"}
                </p>
                <p className={`text-xs ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                  {user?.email}
                </p>
              </>
            )}
          </div>

          {/* Ícone de definições */}
          <Link
            href="/dashboard/settings"
            aria-label="Definições da conta"
            className={`flex h-8 w-8 items-center justify-center border transition-colors ${
              theme === "light"
              ? "border-border-default text-text-primary hover:border-border-strong hover:text-text-primary"
                : "border-border-default text-text-muted hover:border-border-strong hover:text-text-primary"
            }`}
          >
            <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>

          {/* Avatar — clicável para definições */}
          <Link href="/dashboard/settings" aria-label="Ir para definições">
            <div className={`h-9 w-9 overflow-hidden border transition-colors ${
              theme === "light"
                ? "border-border-default hover:border-border-strong"
                : "border-border-default hover:border-border-strong"
            }`}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : isInstitution ? (
                <div className="flex h-full w-full items-center justify-center bg-bg-surface-2">
                  <Building2 className="h-4 w-4 text-blue-400/70" strokeWidth={1.5} />
                </div>
              ) : (
                <Avatar uid={user?.uid ?? ""} photoURL={user?.photoURL} name={user?.displayName} size={36} />
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>

    {/* Search modal */}
    {searchOpen && (
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200" onKeyDown={e => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery(""); }} />
        <div className={`relative w-full max-w-2xl border shadow-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 ${
          theme === "light" ? "border-border-default bg-bg-surface" : "border-border-default bg-bg-surface"
        }`}>
          <div className={`flex items-center gap-3 border-b px-5 shrink-0 ${theme === "light" ? "border-border-default" : "border-border-default"}`}>
            <Search className={`h-5 w-5 shrink-0 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Pesquisar cursos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full bg-transparent py-5 text-lg outline-none ${
                theme === "light" ? "text-text-primary placeholder-text-muted" : "text-text-primary placeholder-text-muted"
              }`}
            />
            {searchLoading && <Loader2 className={`h-5 w-5 animate-spin shrink-0 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`} />}
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className={`shrink-0 text-xs font-mono px-2 py-1 border ${theme === "light" ? "border-border-default text-text-muted" : "border-border-default text-text-muted"}`}
            >
              ESC
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchQuery.length < 2 ? (
              <div className={`px-5 py-12 text-center text-sm ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                Escreva para pesquisar cursos...
              </div>
            ) : searchResults.length === 0 && !searchLoading ? (
              <p className={`px-5 py-12 text-center text-sm ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                Nenhum curso encontrado para "{searchQuery}"
              </p>
            ) : (
              <>
                <p className={`px-5 pt-4 pb-2 text-xs font-medium ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                  {searchResults.length} resultado{searchResults.length !== 1 && "s"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-5 pb-5">
                  {searchResults.map((c) => (
                    <a
                      key={c.id as string}
                      href={`/dashboard/courses/${c.id as string}`}
                      className={`group flex gap-3 border p-3 transition-all ${
                        theme === "light"
                          ? "border-border-default hover:border-border-strong hover:bg-hover-bg"
                          : "border-border-default hover:border-border-strong hover:bg-hover-bg"
                      }`}
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                    >
                      {c.thumbnail ? (
                        <img src={c.thumbnail as string} alt="" className="h-20 w-28 shrink-0 object-cover" />
                      ) : (
                        <div className={`flex h-20 w-28 shrink-0 items-center justify-center ${theme === "light" ? "bg-bg-surface-2" : "bg-bg-surface-2"}`}>
                          <BookOpen className={`h-6 w-6 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <p className={`text-sm font-semibold line-clamp-2 leading-snug ${theme === "light" ? "text-text-primary" : "text-text-primary group-hover:text-text-primary"}`}>{c.title as string}</p>
                          <p className={`text-xs mt-1 line-clamp-1 ${theme === "light" ? "text-text-muted" : "text-text-muted"}`}>
                            {(c.description as string) || "Sem descrição"}
                          </p>
                        </div>
                        <p className={`text-sm font-bold ${theme === "light" ? "text-text-secondary" : "text-text-secondary"}`}>
                          {c.price === 0 ? "Grátis" : `${(c.price as number)?.toLocaleString("pt-AO")} Kz`}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
