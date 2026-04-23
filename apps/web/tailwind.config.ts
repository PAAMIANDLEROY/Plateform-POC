import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004575",
          dark: "#003460",
          light: "#005a96",
        },
        danger: {
          DEFAULT: "#E61853",
          dark: "#c41245",
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
