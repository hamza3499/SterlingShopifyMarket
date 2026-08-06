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
        primary:  "#1A6BF0",
        blue: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        accent:   "#3B82F6",
        success:  "#10B981",
        warning:  "#F59E0B",
        danger:   "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":  "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "blue-gradient":   "linear-gradient(135deg, #1A6BF0 0%, #3B82F6 50%, #60A5FA 100%)",
        "hero-gradient":   "linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 40%, #BFDBFE 100%)",
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      boxShadow: {
        "blue-sm":  "0 4px 16px rgba(30,64,175,0.10)",
        "blue-md":  "0 8px 32px rgba(30,64,175,0.15)",
        "blue-lg":  "0 16px 48px rgba(30,64,175,0.20)",
        "blue-glow":"0 0 20px rgba(59,130,246,0.40)",
      },
    },
  },
  plugins: [],
};
export default config;
