"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { AnnouncementModal } from "@/components/admin/AnnouncementModal";
import type { Announcement, AnnouncementTarget } from "@/types/announcement";

export default function AnnouncementPopup() {
  const { user, plan } = useAuth();
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [queue, setQueue] = useState<Announcement[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchAnnouncements = async () => {
      try {
        const [snap, userDoc] = await Promise.all([
          getDocs(query(
            collection(db, "announcements"),
            where("active", "==", true),
            where("status", "==", "approved")
          )),
          getDoc(doc(db, "users", user.uid)),
        ]);

        if (cancelled) return;

        const now = new Date();
        const seenIds: string[] = userDoc.exists()
          ? (userDoc.data().seenAnnouncements ?? [])
          : [];

        const eligible = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Announcement))
          .filter((a) => {
            if (a.expiresAt && new Date(a.expiresAt) < now) return false;
            if (a.showOnce && seenIds.includes(a.id!)) return false;
            const targets: AnnouncementTarget[] = ["all"];
            if (plan === "smart") targets.push("smart");
            if (plan === "golden") targets.push("smart", "golden");
            if (plan === "free") targets.push("free");
            return targets.includes(a.target);
          })
          .sort((a, b) => {
            if (a.type === "live" && b.type !== "live") return -1;
            if (b.type === "live" && a.type !== "live") return 1;
            return 0;
          });

        if (eligible.length > 0) {
          setCurrent(eligible[0]);
          setQueue(eligible.slice(1));
          setTimeout(() => setVisible(true), 50);
        }
      } catch (err) {
        console.error("Erro ao carregar anúncios:", err);
      }
    };

    fetchAnnouncements();
    return () => { cancelled = true; };
  }, [user, plan]);

  const handleClose = async () => {
    setVisible(false);

    if (!current || !user) return;

    if (current.showOnce) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          seenAnnouncements: arrayUnion(current.id),
        });
      } catch (err) {
        console.error(err);
      }
    }

    setTimeout(() => {
      if (queue.length > 0) {
        setCurrent(queue[0]);
        setQueue(queue.slice(1));
        setTimeout(() => setVisible(true), 50);
      } else {
        setCurrent(null);
      }
    }, 300);
  };

  if (!current) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-gray-950/85 backdrop-blur-md transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-3xl transition-all duration-300 ${
            visible
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-6 scale-95"
          }`}
        >
          {/* Topo — fila + botão fechar */}
          <div className="flex items-center justify-between mb-3 px-1">
            {/* Indicador de fila */}
            {queue.length > 0 ? (
              <span className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/25 text-purple-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                <span className="flex h-1.5 w-1.5 rounded-full bg-purple-400" />
                +{queue.length} {queue.length === 1 ? "anúncio" : "anúncios"} a seguir
              </span>
            ) : (
              <span />
            )}

            {/* Botão X redondo */}
            <button
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800/90 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Card do anúncio */}
          <AnnouncementModal announcement={current} onClose={handleClose} />


        </div>
      </div>
    </>
  );
}
