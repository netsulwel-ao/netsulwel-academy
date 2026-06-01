export type AnnouncementType = "promo" | "new_course" | "live" | "general";
export type AnnouncementTarget = "all" | "free" | "smart" | "golden";

export interface AnnouncementBenefit {
  icon: string;    // nome do ícone Lucide
  title: string;
  desc?: string;
}

export type AnnouncementStatus = "pending" | "approved" | "rejected";

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
  status?: AnnouncementStatus;
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type CountdownVariant = 1 | 2 | 3 | 4 | 5 | 6;

export interface CountdownBanner {
  id?: string;
  active: boolean;
  label: string;           // "Promoção termina em" / "Aula ao vivo começa em"
  endsAt: string;          // ISO datetime
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  badgeLabel?: string;
  color: "red" | "yellow" | "blue" | "green" | "purple";
  variant?: CountdownVariant;
  target: AnnouncementTarget;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const VARIANT_LABELS: Record<CountdownVariant, { name: string; desc: string }> = {
  1: { name: "Banner Horizontal", desc: "Fundo preto, pill roxa com contador, círculo % OFF, botão MATRICULE-SE" },
  2: { name: "Barra Topo", desc: "Fundo vermelho escuro, dígitos grandes separados por : com labels DIAS/HORAS/MIN/SEG" },
  3: { name: "Cards Escuros", desc: "Cards quadrados escuros com borda, números grandes, separados por :" },
  4: { name: "Roxo Vibrante", desc: "Gradiente roxo, caixas translúcidas com borda branca, botão Garantir vaga" },
  5: { name: "Compacta Inline", desc: "Fundo cinza claro, ícone relógio, 4 pills roxas pequenas" },
  6: { name: "Banner com Imagem", desc: "Imagem lateral com fade, badge 82% OFF, contador em pills roxas, botão Matricule-se" },
};
