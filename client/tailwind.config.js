/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SaaS professional color system
        brand: {
          50: '#f0f4ff',
          100: '#dbe5ff',
          200: '#bfd0ff',
          350: '#9cb3ff',
          400: '#7590ff',
          500: '#3b5cff', // Electric Indigo/Blue
          600: '#2540e6',
          700: '#1b2cb8',
          800: '#192494',
          900: '#1a2273',
          950: '#0f1240',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'sm-border': '0 0 0 1px rgba(0, 0, 0, 0.05)',
        'dark-border': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'subtle': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
