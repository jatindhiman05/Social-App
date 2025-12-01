/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkbg: "#0f1115",
        darkcard: "#1a1d23",
        darktext: "#d1d5db",
        accent: "#3b82f6"
        
        
      }
    }
  },
  plugins: [],
}

