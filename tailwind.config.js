/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        qualitas: {
          morado: "#941B80",
          "morado-claro": "#FDF2FA",
          "morado-suave": "#FDF2FA",
          "morado-oscuro": "#7A1369",
          "morado-profundo": "#512950",

          aqua: "#0096AE",
          "aqua-claro": "#E6F7FA",
          "aqua-medio": "#0096AE",
          "aqua-oscuro": "#007A8E",
          "aqua-profundo": "#143B46",
        },
      },

      backgroundImage: {
        "qualitas-gradient":
          "linear-gradient(135deg, #941B80 0%, #692D80 50%, #0096AE 100%)",
      },

      borderRadius: {
        qualitas: "8px",
      },

      boxShadow: {
        qualitas:
          "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },

  plugins: [],
};
