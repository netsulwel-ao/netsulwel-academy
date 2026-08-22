import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a14",
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(120, 80, 220, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(80, 180, 120, 0.1) 0%, transparent 50%)",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #7850dc 0%, #a78bfa 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "sans-serif",
              }}
            >
              N
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "sans-serif",
            letterSpacing: -1,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Netsulwel Academy
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#a0a0b0",
            fontFamily: "sans-serif",
            marginTop: 16,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Domine programação, finanças, tecnologia e investimentos
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#22c55e",
            }}
          />
          <span
            style={{
              fontSize: 16,
              color: "#606070",
              fontFamily: "sans-serif",
            }}
          >
            netsulwel.tech
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
