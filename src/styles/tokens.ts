export const tokens = {
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
    danger: {
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
    },
    success: {
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
    },
    warning: {
      600: "#ea580c",
      700: "#c2410c",
      800: "#92400e",
    },
    info: {
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
    },
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
      950: "#030712",
    },
  },

  spacing: {
    0: "0",
    1: "0.25rem",    // 4px
    2: "0.5rem",     // 8px
    3: "0.75rem",    // 12px
    4: "1rem",       // 16px
    5: "1.25rem",    // 20px
    6: "1.5rem",     // 24px
    8: "2rem",       // 32px
    12: "3rem",      // 48px
    16: "4rem",      // 64px
    20: "5rem",      // 80px
    24: "6rem",      // 96px
  },

  borderRadius: {
    none: "0",
    sm: "0.375rem",   // 6px
    md: "0.5rem",     // 8px
    lg: "0.75rem",    // 12px
    xl: "1rem",       // 16px
    "2xl": "1.5rem",  // 24px
    full: "9999px",
  },

  fontSize: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    md: "1rem",        // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  },

  breakpoints: {
    mobile: "320px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },

  transitions: {
    fast: "150ms",
    base: "200ms",
    slow: "300ms",
    slower: "500ms",
  },
};

export type Tokens = typeof tokens;
