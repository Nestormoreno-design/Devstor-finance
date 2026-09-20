/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#F3F4F1",
        ink: "#12181B",
        pine: {
          DEFAULT: "#1F6E5C",
          light: "#2C8A73",
          dark: "#154A3E",
        },
        gold: {
          DEFAULT: "#C8963E",
          light: "#E0B364",
        },
        brick: {
          DEFAULT: "#B3492F",
          light: "#C96B52",
        },
        line: {
          DEFAULT: "#DDD9D0",
          dark: "#2A322E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      borderRadius: {
        card: "20px",
        chip: "10px",
      },
    },
  },
  plugins: [],
};
