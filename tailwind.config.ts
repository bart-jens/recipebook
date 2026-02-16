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
      colors: {
        cream: "#FFFFFF",
        accent: {
          DEFAULT: "#2D5F5D",
          hover: "#234B49",
          light: "#3D7A72",
        },
        cta: {
          DEFAULT: "#D4913D",
          hover: "#BF7D2E",
        },
        warm: {
          gray: "#6B6B6B",
          border: "#DDD6CC",
          divider: "#E8E2D8",
          tag: "#F0EDE6",
          surface: "#F5F2EC",
        },
        gradient: {
          start: "#D4913D",
          end: "#E8C87C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
