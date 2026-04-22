import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1A3A8F",
          dark: "#122970",
          light: "#2550C0",
        },
        danger: {
          DEFAULT: "#D72638",
          dark: "#b01e2c",
        },
        surface: "#F4F6FA",
        "text-muted": "#4A4A6A",
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
