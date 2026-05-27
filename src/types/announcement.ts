export type AnnouncementType = "promo" | "new_course" | "live" | "general";
export type AnnouncementTarget = "all" | "free" | "smart" | "golden";

export interface AnnouncementBenefit {
  icon: string;    // nome do ícone Lucide
  title: string;
  desc?: string;
}

export interface Announcement {
  id?: string;
  type: AnnouncementType;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  target: AnnouncementTarget;
  active: boolean;
  showOnce: boolean;
  expiresAt?: string;
  benefits?: AnnouncementBenefit[];
  badgeLabel?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CountdownBanner {
  id?: string;
  active: boolean;
  label: string;           // "Promoção termina em" / "Aula ao vivo começa em"
  endsAt: string;          // ISO datetime
  ctaLabel?: string;
  ctaUrl?: string;
  color: "red" | "yellow" | "blue" | "green" | "purple";
  target: AnnouncementTarget;
  createdAt?: unknown;
  updatedAt?: unknown;
}
