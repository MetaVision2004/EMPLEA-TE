import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul marino y turquesa del logo: confianza, claridad y avance
        primary: {
          50: "#EFFBFC",
          100: "#D7F2F4",
          200: "#B0E4E9",
          300: "#78CFD8",
          400: "#43B5C3",
          500: "#1B7894", // base
          600: "#176681",
          700: "#123F69",
          800: "#0D3155",
          900: "#08213C",
        },
        // Dorado del logo: energía y llamados a la acción
        accent: {
          50: "#FFF9E6",
          100: "#FCEFC2",
          200: "#F7DF8B",
          300: "#F0C85A",
          400: "#E7B638",
          500: "#D59D22", // base
          600: "#B98216",
          700: "#946516",
          800: "#704B12",
          900: "#4D330D",
        },
        // Verde señal: estados positivos (oferta / contratado)
        growth: {
          50: "#E9F8F1",
          500: "#1FA97A",
          600: "#178860",
        },
        paper: "#F5FAFA",
        ink: "#142A3D",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(20, 42, 61, 0.08), 0 8px 24px -8px rgba(20, 42, 61, 0.10)",
        lift: "0 12px 32px -8px rgba(20, 42, 61, 0.22)",
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
