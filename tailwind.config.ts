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
        logo: ["Fraunces", "Georgia", "serif"],
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
          gray: "#666666",
          border: "#E8E8E8",
          divider: "#E8E8E8",
          tag: "#F5F5F5",
          surface: "#F5F5F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
