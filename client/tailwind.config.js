/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#67e8f9", // cyan-300
          DEFAULT: "#06b6d4", // cyan-500
          dark: "#0e7490", // cyan-700
        },
        secondary: {
          light: "#f9a8d4", // pink-300
          DEFAULT: "#ec4899", // pink-500
          dark: "#be185d", // pink-700
        },
        neutral: colors.slate, // Using slate for neutrals
        accent: colors.amber,
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
        mono: [
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
