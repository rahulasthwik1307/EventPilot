import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D97706",
          hover: "#B45309",
          subtle: "#FEF3C7",
        },
        secondary: {
          DEFAULT: "#C2410C",
          subtle: "#FFEDD5",
        },
        neutral: {
          bg: "#FDFBF7",
          surface: "#FFFFFF",
          subtle: "#F5EFEB",
          border: "#E7DFD5",
          "border-strong": "#D6CCC2",
          text: "#1C1917",
          muted: "#78716C",
        },
        status: {
          success: "#15803D",
          "success-subtle": "#DCFCE7",
          warning: "#B45309",
          "warning-subtle": "#FEF3C7",
          danger: "#B91C1C",
          "danger-subtle": "#FEE2E2",
        },
      },
      fontFamily: {
        display: ["var(--font-eczar)", "Eczar", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(28, 25, 23, 0.04), 0 4px 12px rgba(28, 25, 23, 0.03)",
        drawer: "0 12px 32px -4px rgba(28, 25, 23, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
