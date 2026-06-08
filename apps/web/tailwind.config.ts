import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A3A8F",
          dark: "#142D70",
          light: "#2347B0",
        },
        danger: {
          DEFAULT: "#D72638",
          dark: "#B5202F",
        },
        surface: "#F4F6FA",
        "text-muted": "#4A4A6A",
        navy: {
          DEFAULT: "#0B1D3A",
          dark: "#060F1E",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
