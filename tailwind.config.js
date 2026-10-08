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
          "morado-claro": "#D12893",
          "morado-suave": "#9279BA",
          "morado-oscuro": "#692D80",
          "morado-profundo": "#512950",

          aqua: "#0096AE",
          "aqua-claro": "#46B8E9",
          "aqua-medio": "#0F98D7",
          "aqua-oscuro": "#037081",
          "aqua-profundo": "#143B46",
        },
      },

      backgroundImage: {
        "qualitas-gradient":
          "linear-gradient(135deg, #941B80 0%, #692D80 50%, #0096AE 100%)",
      },

      borderRadius: {
        qualitas: "24px",
      },

      boxShadow: {
        qualitas:
          "0 8px 30px rgba(0, 0, 0, 0.15)",
      },
    },
  },

  plugins: [],
};
