"use client";
import { useCountdown } from "@/hooks/useCountdown";
import Link from "next/link";
const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23202224'/%3E%3Ctext x='200' y='110' text-anchor='middle' fill='%23666' font-size='16' font-family='sans-serif'%3EPromo%3C/text%3E%3C/svg%3E";

interface Props {
  targetDate: string | Date;
  label?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  badgeLabel?: string;
}

export default function Variant6ImageBanner({
  targetDate,
  label,
  ctaLabel,
  ctaUrl,
  imageUrl,
  badgeLabel,
}: Props) {
  const t = useCountdown(targetDate);
  if (t.expired) return null;

  const units: { value: number; label: string }[] = [
    { value: t.d, label: "dias" },
    { value: t.h, label: "hrs" },
    { value: t.m, label: "min" },
    { value: t.s, label: "seg" },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "100px",
        width: "100%",
        background: "#0d0d0d",
        padding: "0 24px",
      }}
    >
      {/* ZONA ESQUERDA — imagem com fade */}
      <div
        style={{
          position: "relative",
          width: "220px",
          height: "100px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <img
          src={imageUrl || PLACEHOLDER}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, transparent, #0d0d0d)",
          }}
        />
      </div>

      {/* ZONA CENTRAL — tudo numa linha só horizontal */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "16px",
          flex: 1,
          justifyContent: "center",
        }}
      >
        {/* Badge */}
        {badgeLabel && (
          <span
            style={{
              background: "#a020f0",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 700,
              padding: "6px 16px",
              borderRadius: "999px",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {badgeLabel}
          </span>
        )}

        {/* Título */}
        <span
          style={{
            color: "#fff",
            fontSize: "18px",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {label || "Oferta Especial"}
        </span>

        {/* Separador vertical */}
        <span
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: "24px",
            fontWeight: 100,
          }}
        >
          |
        </span>

        {/* Termina em + countdown */}
        <span
          style={{
            color: "#9ca3af",
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          Termina em
        </span>

        {units.flatMap((u, i) => [
          <div
            key={u.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "#a020f0",
              borderRadius: "8px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#fff",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(u.value).padStart(2, "0")}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1,
                marginTop: "2px",
              }}
            >
              {u.label}
            </span>
          </div>,
          ...(i < units.length - 1
            ? [
                <span
                  key={`sep-${u.label}`}
                  style={{
                    color: "#4b5563",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  :
                </span>,
              ]
            : []),
        ])}
      </div>

      {/* ZONA DIREITA — botão CTA */}
      {ctaUrl ? (
        <Link
          href={ctaUrl}
          style={{
            background: "#a020f0",
            color: "#fff",
            padding: "12px 28px",
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          {ctaLabel || "VER"}
        </Link>
      ) : (
        <button
          style={{
            background: "#a020f0",
            color: "#fff",
            padding: "12px 28px",
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {ctaLabel || "VER"}
        </button>
      )}
    </div>
  );
}
