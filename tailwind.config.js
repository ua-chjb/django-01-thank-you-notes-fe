/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0084FF',
        secondary: '#00C896',
        success: '#31A24C',
        warning: '#F7B928',
        error: '#E41E3F',
        christmas: {
          light: '#31A24C',
          DEFAULT: '#2D7A3E',
          dark: '#1F5A2E'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}