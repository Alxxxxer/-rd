/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-end Harmonious Dark Theme Color System (Tailored HSL values)
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#dae3ff',
          300: '#bdcbff',
          400: '#94a7ff',
          500: '#637bff', // Custom Electric Brand Blue
          600: '#3e52ff',
          700: '#2c3be6',
          800: '#242fb9',
          900: '#232c93',
          950: '#151756',
        },
        slate: {
          950: '#0b0f19', // Pure Deep Premium Charcoal-Black
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 15px rgba(99, 123, 255, 0.4)',
      }
    },
  },
  plugins: [],
}
