/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          coral: '#e14e2a',
          coralLight: '#ff6b47',
          coralDark: '#be3918',
          teal: '#0d9488',
          navy: '#0b1120',
          darkBg: '#060D17',
          darkCard: '#0B132B',
          emerald: '#10B981',
          emeraldGlow: '#34D399',
          cyanGlow: '#38BDF8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.3)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }
    },
  },
  plugins: [],
};
