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
        // Google Stitch Minimalist Palette
        canvas: '#F5F5F4', // Warm stone / concrete background
        surface: '#FFFFFF', // Crisp white cards and surfaces
        charcoal: {
          DEFAULT: '#252525', // Deep graphite / primary text and buttons
          hover: '#3a3a3a',
          active: '#151515',
        },
        bodyText: '#666666', // Secondary text
        mutedText: '#929292', // Muted text / tertiary
        hairline: '#E5E5E5', // Thin 1px borders
        brand: {
          50: '#F5F5F4',
          100: '#E5E5E5',
          200: '#D4D4D4',
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#252525',
          700: '#1F1F1F',
          800: '#171717',
          900: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '0.25rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
      }
    },
  },
  plugins: [],
}
