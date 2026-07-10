import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#e8ecf4",
          100: "#c5cfe3",
          200: "#9aafd0",
          300: "#6f8fbd",
          400: "#4d75ae",
          500: "#2b5b9f",
          600: "#1e4484",
          700: "#132e61",
          800: "#0e2247",
          900: "#0B1628",
          950: "#07101d",
        },
        amber: {
          50: "#fef9ed",
          100: "#fdf0c8",
          200: "#fae48e",
          300: "#f7d054",
          400: "#F4A72A",
          500: "#e8891a",
          600: "#cc6910",
          700: "#a84b10",
          800: "#8a3b14",
          900: "#723114",
        },
        ocean: {
          400: "#38b2d4",
          500: "#2596b4",
          600: "#1a7a94",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans KR'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
