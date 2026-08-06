"use client";

/**
 * Avatar com Identicon gerado deterministicamente a partir do UID.
 * Igual ao estilo GitHub — grade 5×5 com simetria espelhada.
 * Sem dependências externas.
 */

import { useMemo } from "react";

// ── Paleta de cores por hash ───────────────────────────────────
const COLORS = [
  "#7c3aed", // purple
  "#16a34a", // green
  "#2563eb", // blue
  "#dc2626", // red
  "#d97706", // amber
  "#0891b2", // cyan
  "#db2777", // pink
  "#7c3aed", // purple (repetir para distribuição)
  "#059669", // emerald
  "#4f46e5", // indigo
];

/**
 * Hash simples e determinística — mesma entrada = mesmo resultado sempre.
 */
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Gera a grelha 5×5 do identicon.
 * Simetria horizontal: colunas 0,1,2 determinam 3,4 por espelho.
 */
function generateGrid(uid: string): boolean[] {
  const h = hash(uid);
  const grid: boolean[] = [];

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      // Coluna efectiva (0-2), espelhada para 3-4
      const effectiveCol = col > 2 ? 4 - col : col;
      const bit = (h >> (row * 3 + effectiveCol)) & 1;
      grid.push(bit === 1);
    }
  }
  return grid;
}

function pickColor(uid: string): string {
  return COLORS[hash(uid) % COLORS.length];
}

// ── Componente SVG Identicon ───────────────────────────────────
interface IdenticonProps {
  uid: string;
  size?: number;
  className?: string;
}

export function Identicon({ uid, size = 40, className = "" }: IdenticonProps) {
  const { grid, color } = useMemo(() => ({
    grid:  generateGrid(uid),
    color: pickColor(uid),
  }), [uid]);

  const cellSize = size / 5;
  const padding  = Math.round(size * 0.1); // 10% padding interno

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Fundo */}
      <rect width={size} height={size} fill="#111827" />

      {/* Células */}
      {grid.map((filled, i) => {
        if (!filled) return null;
        const row = Math.floor(i / 5);
        const col = i % 5;
        return (
          <rect
            key={i}
            x={col * cellSize + padding / 2}
            y={row * cellSize + padding / 2}
            width={cellSize - padding / 2}
            height={cellSize - padding / 2}
            fill={color}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

// ── Componente Avatar completo ─────────────────────────────────
interface AvatarProps {
  uid: string;
  photoURL?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  /** Se true, mostra a inicial em vez do identicon quando não há foto */
  fallbackInitial?: boolean;
}

export function Avatar({
  uid,
  photoURL,
  name,
  size = 40,
  className = "",
  fallbackInitial = false,
}: AvatarProps) {
  const sizeStyle = { width: size, height: size, minWidth: size, minHeight: size };

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name ?? "Avatar"}
        style={sizeStyle}
        className={`object-cover ${className}`}
      />
    );
  }

  if (fallbackInitial && name) {
    const initial = name[0]?.toUpperCase() ?? "?";
    const bg = pickColor(uid);
    return (
      <div
        style={{ ...sizeStyle, backgroundColor: `${bg}20`, borderColor: `${bg}30` }}
        className={`flex items-center justify-center border font-bold text-[--c] ${className}`}
      >
        <span style={{ color: bg, fontSize: size * 0.38 }}>{initial}</span>
      </div>
    );
  }

  // Identicon — igual ao GitHub
  return (
    <Identicon
      uid={uid}
      size={size}
      className={className}
    />
  );
}
