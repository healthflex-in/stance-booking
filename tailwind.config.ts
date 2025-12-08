import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
        'unbounded': ['Unbounded', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#203A37",
        secondary: "#DDFE71",
        "primary-light": "#FCFAF1",
        "primary-dark": "#132321",
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-purple-100',
    'bg-pink-100',
    'bg-indigo-100',
    'bg-orange-100',
    'bg-teal-100',
    'bg-rose-100',
    'bg-cyan-100',
  ],
} satisfies Config;
