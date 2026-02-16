import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "DM Sans",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Fraunces",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out forwards",
      },
      colors: {
        accent: {
          DEFAULT: "#2D5F5D",
          hover: "#234B49",
          light: "#3D7A72",
        },
        cta: {
          DEFAULT: "#2D5F5D",
          hover: "#234B49",
        },
        warm: {
          gray: "#6B7280",
          border: "#E2E8F0",
          divider: "#E2E8F0",
          tag: "#F1F5F9",
          surface: "#F8FAFC",
        },
        gradient: {
          start: "#2D5F5D",
          end: "#5BA8A3",
        },
      },
    },
  },
  plugins: [],
};
export default config;
