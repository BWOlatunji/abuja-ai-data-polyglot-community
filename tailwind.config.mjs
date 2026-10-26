import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf6ee",
          100: "#cdebd7",
          200: "#9ad6af",
          300: "#67c187",
          400: "#3a9f60",
          500: "#1b7339",
          600: "#15602f",
          700: "#114c26",
          800: "#0d391c",
          900: "#082613",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Sora'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
        "card-hover": "0 4px 8px rgba(16,24,40,0.08), 0 2px 4px rgba(16,24,40,0.08)",
      },
    },
  },
  plugins: [typography],
};
