/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports switching to dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E62DA9',
          glow: 'rgba(230, 45, 169, 0.35)',
          hover: '#c81b8d'
        },
        secondary: {
          DEFAULT: '#FEDC85',
          glow: 'rgba(254, 220, 133, 0.35)',
          hover: '#ecd16a'
        },
        darkbg: '#F8FAFC',
        darkcard: 'rgba(255, 255, 255, 0.85)',
        darkborder: 'rgba(0, 0, 0, 0.07)',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-primary': '0 4px 14px 0 rgba(230, 45, 169, 0.15)',
        'glow-secondary': '0 4px 14px 0 rgba(254, 220, 133, 0.15)',
        'glass': '0 8px 32px 0 rgba(15, 23, 42, 0.05)'
      },
      backdropBlur: {
        'glass': '16px'
      }
    },
  },
  plugins: [],
}
