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
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        serif: [
          "Playfair Display",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      colors: {
        cream: "#FFFBF5",
        accent: {
          DEFAULT: "#C8553D",
          hover: "#A8432F",
        },
        warm: {
          gray: "#6B6B6B",
          border: "#E8E0D8",
          divider: "#F0EBE4",
          tag: "#F5F0EA",
        },
      },
    },
  },
  plugins: [],
};
export default config;
