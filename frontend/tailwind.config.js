/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        taller: {
          50: "#f8fafc",
          900: "#0f172a",
          accent: "#2563eb", // Azul mecánico profesional
        },
      },
    },
  },
  plugins: [],
};
