import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f8f7ff",
          100: "#f2e8ff",
          200: "#e5ceff",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a855f7",
          800: "#9333ea",
          900: "#7e22ce",
        },
        secondary: {
          50: "#f0fdf4",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
        },
      },
      spacing: {
        0: "0",
        1: "0.25rem",
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
        5: "1.25rem",
        6: "1.5rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        20: "5rem",
        24: "6rem",
      },
      borderRadius: {
        none: "0",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.5rem",
        full: "9999px",
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        md: "1rem",
        lg: "1.125rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
      },
      animation: {
        "aurora-drift": "aurora-drift 15s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "slide-in-top": "slide-in-top 0.5s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "spin-slow": "spin-slow 20s linear infinite",
        "page-enter": "page-enter 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "page-exit": "page-exit 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "page-enter-dashboard": "page-enter-dashboard 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "overlay-enter": "overlay-enter 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "content-stagger": "content-stagger 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.8" },
          "50%": { transform: "translate(30px, -20px) scale(1.05)", opacity: "0.9" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5", "box-shadow": "0 0 20px rgba(168, 85, 247, 0.2)" },
          "50%": { opacity: "0.8", "box-shadow": "0 0 40px rgba(168, 85, 247, 0.4)" },
        },
        shimmer: {
          "0%": { "background-position": "-1000px 0" },
          "100%": { "background-position": "1000px 0" },
        },
        "slide-in-top": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.3) translateY(-100px)" },
          "50%": { opacity: "1" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1) translateY(0)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "page-enter": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "page-exit": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(1.05)" },
        },
        "page-enter-dashboard": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "overlay-enter": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "content-stagger": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
