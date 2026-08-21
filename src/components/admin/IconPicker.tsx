"use client";

import type { ElementType, ComponentType } from "react";
import * as Icons from "lucide-react";

type LucideIcon = ComponentType<{ className?: string }>;
const iconMap = Icons as unknown as Record<string, LucideIcon>;

export function getLucideIcon(name: string): LucideIcon | null {
  return iconMap[name] ?? null;
}

// Ícones disponíveis para benefícios de anúncios
export const AVAILABLE_ICONS: { name: string; label: string }[] = [
  { name: "Zap", label: "Zap" },
  { name: "Star", label: "Estrela" },
  { name: "Crown", label: "Coroa" },
  { name: "Trophy", label: "Troféu" },
  { name: "Award", label: "Prémio" },
  { name: "Shield", label: "Escudo" },
  { name: "CheckCircle2", label: "Check" },
  { name: "Rocket", label: "Foguete" },
  { name: "Flame", label: "Chama" },
  { name: "Target", label: "Alvo" },
  { name: "TrendingUp", label: "Crescimento" },
  { name: "BarChart2", label: "Gráfico" },
  { name: "DollarSign", label: "Dinheiro" },
  { name: "Wallet", label: "Carteira" },
  { name: "PiggyBank", label: "Poupança" },
  { name: "BookOpen", label: "Livro" },
  { name: "GraduationCap", label: "Formação" },
  { name: "Brain", label: "Cérebro" },
  { name: "Lightbulb", label: "Ideia" },
  { name: "Code2", label: "Código" },
  { name: "Monitor", label: "Monitor" },
  { name: "Smartphone", label: "Mobile" },
  { name: "Globe", label: "Global" },
  { name: "Users", label: "Comunidade" },
  { name: "MessageSquare", label: "Chat" },
  { name: "Video", label: "Vídeo" },
  { name: "Play", label: "Play" },
  { name: "Clock", label: "Tempo" },
  { name: "Calendar", label: "Calendário" },
  { name: "Lock", label: "Cadeado" },
  { name: "Unlock", label: "Desbloqueado" },
  { name: "Gift", label: "Oferta" },
  { name: "Percent", label: "Desconto" },
  { name: "Infinity", label: "Ilimitado" },
  { name: "RefreshCw", label: "Atualização" },
  { name: "HeadphonesIcon", label: "Suporte" },
  { name: "ThumbsUp", label: "Aprovado" },
  { name: "Heart", label: "Favorito" },
  { name: "Sparkles", label: "IA" },
  { name: "Layers", label: "Trilhas" },
];

export function getIcon(name: string, className = "h-5 w-5") {
  const Icon = getLucideIcon(name);
  if (!Icon) return null;
  return <Icon className={className} />;
}

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  onClose: () => void;
}

export default function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-full max-w-72 bg-gray-900 border border-gray-700 shadow-2xl p-3">
      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Escolher ícone</p>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 max-h-48 overflow-y-auto">
        {AVAILABLE_ICONS.map((ic) => {
          const Icon = getLucideIcon(ic.name);
          if (!Icon) return null;
          return (
            <button
              key={ic.name}
              type="button"
              title={ic.label}
              onClick={() => { onChange(ic.name); onClose(); }}
              className={`flex items-center justify-center h-8 w-8 transition-colors ${
                value === ic.name
                  ? "bg-purple text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
