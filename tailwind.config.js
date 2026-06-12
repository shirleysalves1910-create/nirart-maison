/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        nirart: {
          green: '#6FBFA9',
          wine: '#B2181B',
          bg: '#F8F6F2',
          card: '#FFFFFF',
          text: '#2B2B2B',
        }
      }
    },
  },
  plugins: [],
}
