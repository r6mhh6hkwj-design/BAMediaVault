/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 硬核暗黑主题色板
        ink: {
          black: "#000000",
          950: "#050505",
          900: "#0A0A0A",
          800: "#141414",
          700: "#1C1C1C",
          600: "#262626",
        },
        // 霓虹橙强调色
        neon: {
          DEFAULT: "#FF6B00",
          light: "#FF8533",
          dark: "#CC5500",
          glow: "rgba(255, 107, 0, 0.4)",
        },
        // 金属银文字色
        silver: {
          DEFAULT: "#E5E5E5",
          muted: "#A0A0A0",
          dim: "#6B6B6B",
        },
        danger: "#FF3B3B",
      },
      fontFamily: {
        display: ['"Oswald"', '"Bebas Neue"', "Impact", "sans-serif"],
        body: ['"Barlow Condensed"', '"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "breath": "breath 4s ease-in-out infinite",
        "pulse-neon": "pulse-neon 2.5s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        "float-slower": "float-slow 18s ease-in-out infinite",
        "stagger-in": "stagger-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "shimmer": "shimmer 2s linear infinite",
        "shake": "shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "border-flow": "border-flow 3s linear infinite",
        "ripple": "ripple 0.6s ease-out",
      },
      keyframes: {
        breath: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.92" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 107, 0, 0.5)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(255, 107, 0, 0.3)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 30px) scale(0.95)" },
        },
        "stagger-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        shake: {
          "10%, 90%": { transform: "translateX(-1px)" },
          "20%, 80%": { transform: "translateX(2px)" },
          "30%, 50%, 70%": { transform: "translateX(-4px)" },
          "40%, 60%": { transform: "translateX(4px)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "60%": { opacity: "1", transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.6" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
