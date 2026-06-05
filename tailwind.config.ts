import type { Config } from "tailwindcss";

/**
 * Tailwind theme derived 1:1 from the SwiftChat Design System
 * (Screenshots/swiftchat-design-system.md). Primitive ramps + semantic
 * aliases live here so the whole app references tokens, never raw hex.
 * RAG + grade scales are added for the education-scorecard domain.
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── SwiftChat primary (brand blue) ─────────────────────────
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C3D2FC",
          300: "#84A2F4",
          400: "#345CCC",
          500: "#386AF6", // brand
          600: "#1339A3",
          700: "#2B3E8B",
          800: "#041B5B",
          DEFAULT: "#386AF6",
        },
        // ── SwiftChat neutral ramp ─────────────────────────────────
        neutral: {
          0: "#FFFFFF",
          50: "#ECECEC",
          100: "#D5D8DF",
          150: "#BBC6DD",
          200: "#A4ADC1",
          300: "#999999",
          400: "#828996",
          500: "#7383A5",
          600: "#32304B",
          700: "#2A284D",
          800: "#1C1B34",
          900: "#0E0E0E",
        },
        // ── Status (RAG-aligned) ───────────────────────────────────
        success: { DEFAULT: "#00BA34", text: "#007B22", subtle: "#D4F5DC", strong: "#00972B" },
        warning: { DEFAULT: "#F8B200", text: "#9A6500", subtle: "#FFF3CC", strong: "#D89400" },
        error: { DEFAULT: "#EB5757", text: "#C0392B", subtle: "#FDEAEA", strong: "#D6442F" },
        info: { DEFAULT: "#84A2F4", text: "#345CCC", subtle: "#E0E7FF" },
        // ── RAG semantic (green / amber / red) ─────────────────────
        rag: {
          green: "#16A34A", // fill / bar / dot
          greenSoft: "#DCFCE7",
          greenText: "#15803D", // AA text on white & soft
          amber: "#F59E0B",
          amberSoft: "#FEF3C7",
          amberText: "#92600A", // AA text
          red: "#EF4444",
          redSoft: "#FEE2E2",
          redText: "#B91C1C", // AA text
          na: "#9CA3AF",
          naSoft: "#F1F3F6",
          naText: "#5B6472", // AA text (light grey reserved for dot/border)
        },
        // ── Education-government accent (trustworthy teal/green) ────
        edu: {
          ink: "#0B1F3A",
          deep: "#10254A",
          teal: "#0E7C86",
          tealSoft: "#E0F2F1",
          gold: "#E8A317",
        },
        // ── SwiftChat soft card tints ──────────────────────────────
        card: {
          blue: "#A4E2FA",
          yellow: "#FDE1AC",
          green: "#CCEFBF",
          orange: "#FFD4BB",
          pink: "#FCD5F1",
          mint: "#CFFBDB",
          cream: "#FFF5D0",
          lightGreen: "#ECFFE5",
          purple: "#D7C9FF",
        },
        // ── Semantic surface/text/border (light) ───────────────────
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F6FA",
          sunken: "#ECEFF5",
        },
        line: { DEFAULT: "#E2E6EE", subtle: "#EFF1F6", strong: "#C9CFDB" },
      },
      fontFamily: {
        sans: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        indic: ["Mukta", "Montserrat", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // SwiftChat scale
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "26px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "44px" }],
        "5xl": ["45px", { lineHeight: "52px" }],
        "6xl": ["57px", { lineHeight: "64px" }],
      },
      borderRadius: {
        none: "0px",
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
        full: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 37, 74, 0.04), 0 4px 16px rgba(16, 37, 74, 0.06)",
        raised: "0 8px 28px rgba(16, 37, 74, 0.12)",
        ring: "0 0 0 4px rgba(56, 106, 246, 0.12)",
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(0.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "ring-fill": { from: { strokeDashoffset: "var(--ring-circ)" }, to: { strokeDashoffset: "var(--ring-offset)" } },
        "bar-grow": { from: { transform: "scaleY(0)" }, to: { transform: "scaleY(1)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pop: { "0%": { transform: "scale(0.8)", opacity: "0" }, "60%": { transform: "scale(1.05)" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        "bar-grow": "bar-grow 0.6s cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 0.45s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
