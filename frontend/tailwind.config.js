/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: "#C7272F",
        "primary-dark": "#A31F26",
        secondary: "#5B5B5B",
        "light-grey": "#F5F5F5",
        "border-grey": "#DDDDDD",
        success: "#2E7D32",
        warning: "#ED6C02",
        error: "#C7272F",
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
