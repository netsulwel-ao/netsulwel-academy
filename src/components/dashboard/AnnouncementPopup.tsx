"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import { AnnouncementModal } from "@/app/admin/announcements/page";
import type { Announcement, AnnouncementTarget } from "@/types/announcement";

export default function AnnouncementPopup() {
  const { user, plan } = useAuth();
  const [current, setCurrent] = useState<Announcement | null>(null);
  const [queue, setQueue] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchAnnouncements = async () => {
      try {
        // Busca anúncios ativos
        const snap = await getDocs(
          query(collection(db, "announcements"), where("active", "==", true))
        );

        const now = new Date();
        const userDoc = await import("firebase/firestore").then(({ getDoc }) =>
          getDoc(doc(db, "users", user.uid))
        );
        const seenIds: string[] = userDoc.exists() ? (userDoc.data().seenAnnouncements ?? []) : [];

        const eligible = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Announcement))
          .filter((a) => {
            // Expiração
            if (a.expiresAt && new Date(a.expiresAt) < now) return false;
            // showOnce — já viu?
            if (a.showOnce && seenIds.includes(a.id!)) return false;
            // Target
            const targets: AnnouncementTarget[] = ["all"];
            if (plan === "smart") targets.push("smart");
            if (plan === "golden") targets.push("smart", "golden");
            if (plan === "free") targets.push("free");
            return targets.includes(a.target);
          })
          // live primeiro, depois por ordem de criação
          .sort((a, b) => {
            if (a.type === "live" && b.type !== "live") return -1;
            if (b.type === "live" && a.type !== "live") return 1;
            return 0;
          });

        if (eligible.length > 0) {
          setCurrent(eligible[0]);
          setQueue(eligible.slice(1));
        }
      } catch (err) {
        console.error("Erro ao carregar anúncios:", err);
      }
    };

    fetchAnnouncements();
  }, [user, plan]);

  const handleClose = async () => {
    if (!current || !user) return;

    // Marca como visto se showOnce
    if (current.showOnce) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          seenAnnouncements: arrayUnion(current.id),
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Avança para o próximo da fila
    if (queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(queue.slice(1));
    } else {
      setCurrent(null);
    }
  };

  if (!current) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

          {/* Close button — fora do card */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center bg-gray-900 border border-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <AnnouncementModal announcement={current} onClose={handleClose} />

          {/* Fechar link + queue indicator */}
          <div className="flex items-center justify-between mt-3 px-1">
            <button onClick={handleClose} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Fechar
            </button>
            {queue.length > 0 && (
              <p className="text-xs text-gray-500">
                +{queue.length} {queue.length === 1 ? "anúncio" : "anúncios"} a seguir
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
