import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde-tinta profundo: confianza, estabilidad, "raíz" del proyecto
        primary: {
          50: "#EAF3F1",
          100: "#CFE3DF",
          200: "#A3C8C1",
          300: "#71A89F",
          400: "#457F76",
          500: "#0E4F45", // base
          600: "#0C443B",
          700: "#0A362F",
          800: "#082A25",
          900: "#061F1B",
        },
        // Coral cálido: la chispa del primer paso, usado con moderación en CTAs
        accent: {
          50: "#FFEEE9",
          100: "#FFD6C9",
          200: "#FFB49B",
          300: "#FF8C69",
          400: "#FF7350",
          500: "#F0552F", // base
          600: "#D4441F",
          700: "#AC3618",
          800: "#832912",
          900: "#5C1C0C",
        },
        // Verde señal: estados positivos (oferta / contratado)
        growth: {
          50: "#E9F8F1",
          500: "#1FA97A",
          600: "#178860",
        },
        paper: "#F5F7F5",
        ink: "#132420",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(19, 36, 32, 0.08), 0 8px 24px -8px rgba(19, 36, 32, 0.10)",
        lift: "0 12px 32px -8px rgba(19, 36, 32, 0.22)",
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
