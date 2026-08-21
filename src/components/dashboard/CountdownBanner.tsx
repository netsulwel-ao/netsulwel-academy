"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { X } from "lucide-react";
import type { CountdownBanner as CountdownBannerType, AnnouncementTarget, CountdownVariant } from "@/types/announcement";
import {
  Variant1Banner,
  Variant2TopBar,
  Variant3DarkCards,
  Variant4Purple,
  Variant5Compact,
  Variant6ImageBanner,
} from "@/components/countdown";

type VariantProps = { targetDate: string; label?: string; ctaLabel?: string; ctaUrl?: string; imageUrl?: string; badgeLabel?: string };

const VARIANT_MAP: Record<CountdownVariant, React.ComponentType<VariantProps>> = {
  1: Variant1Banner,
  2: Variant2TopBar,
  3: Variant3DarkCards,
  4: Variant4Purple,
  5: Variant5Compact,
  6: Variant6ImageBanner,
};

export default function CountdownBanner() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<CountdownBannerType[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "countdownBanners"), where("active", "==", true))
        );
        const now = new Date();
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CountdownBannerType))
          .filter((b) => {
            if (new Date(b.endsAt) <= now) return false;
            return true;
          });
        setBanners(all);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [user?.uid]);

  const visible = banners.filter((b) => !dismissed.includes(b.id!));
  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      {visible.map((b) => {
        const Variant = VARIANT_MAP[b.variant ?? 1];
        return (
          <div key={b.id} className="relative">
            <Variant targetDate={b.endsAt} label={b.label} ctaLabel={b.ctaLabel} ctaUrl={b.ctaUrl} imageUrl={b.imageUrl} badgeLabel={b.badgeLabel} />
            <button onClick={() => setDismissed((p) => [...p, b.id!])}
              className="absolute top-1 right-1 text-gray-500 hover:text-white transition-colors p-1 z-10">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
