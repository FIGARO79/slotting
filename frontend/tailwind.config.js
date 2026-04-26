/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', '"Segoe UI"', 'Inter', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        print: ['Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        'sap-primary': '#354a5f',
        'sap-shell': '#354a5f',
        'sap-bg': '#f5f7fa',
        'sap-text': '#1a1c1e',
        'sap-header': '#001d35',
      }
    },
  },
  plugins: [],
}
