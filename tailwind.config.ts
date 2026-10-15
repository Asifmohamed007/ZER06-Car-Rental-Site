import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#2024AA", bright: "#3A3FD9", deep: "#161A7E" },
        navy: { DEFAULT: "#070A29", 900: "#04061A", 800: "#0B1038", 700: "#121852" },
        ink: "#03040D",
        cream: { DEFAULT: "#FEEDDB", soft: "#EBDCCB", dim: "#B9AEA6" },
        chrome: "#AEB3C2",
        ok: "#5BD69A",
        warn: "#F2C14E",
        bad: "#FF7A7A",
      },
      fontFamily: {
        display: ['"Saira Condensed"', "Arial Narrow", "sans-serif"],
        sans: ["Saira", "system-ui", "sans-serif"],
      },
      maxWidth: { page: "76rem" },
    },
  },
  plugins: [],
} satisfies Config;
