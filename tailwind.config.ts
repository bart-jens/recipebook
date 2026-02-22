import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter Tight", "system-ui", "sans-serif"],
        sans: ["Inter Tight", "system-ui", "sans-serif"],
        logo: ["Inter Tight", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#F6F4EF",
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#EDEADE",
        },
        ink: {
          DEFAULT: "#141210",
          secondary: "#5C5850",
          muted: "#9C978C",
        },
        border: {
          DEFAULT: "#D6D2C8",
          strong: "#141210",
        },
        accent: {
          DEFAULT: "#8B4513",
          light: "rgba(139,69,19,0.07)",
        },
        olive: {
          DEFAULT: "#4A5D3A",
          light: "rgba(74,93,58,0.08)",
        },
        // Backward-compat aliases
        warm: {
          gray: "#5C5850",
          border: "#D6D2C8",
          divider: "#D6D2C8",
          tag: "#EDEADE",
          surface: "#EDEADE",
        },
        cta: {
          DEFAULT: "#8B4513",
          hover: "#6D360F",
        },
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-14px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        lineGrow: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        heroZoom: {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        checkPop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up":
          "fadeInUp 0.55s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in-left":
          "slideInLeft 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "line-grow":
          "lineGrow 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "hero-zoom":
          "heroZoom 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        "check-pop":
          "checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        "scale-in":
          "scaleIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
