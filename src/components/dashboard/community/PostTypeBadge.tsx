import type { CommunityPostType } from "@/types/community";

const config: Record<CommunityPostType, { label: string; classes: string }> = {
  duvida: { label: "Dúvida", classes: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  projeto: { label: "Projeto", classes: "text-green-400 bg-green-500/10 border-green-500/20" },
  discussao: { label: "Discussão", classes: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  dica: { label: "Dica", classes: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

export default function PostTypeBadge({ type }: { type: CommunityPostType }) {
  const c = config[type];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-sm font-bold border ${c.classes}`}>
      {c.label}
    </span>
  );
}
