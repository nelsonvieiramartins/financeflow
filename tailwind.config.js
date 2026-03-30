/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          light: '#8B84FF',
          dark: '#4D45E6',
        },
        bg: {
          base: '#0F0F14',
          surface: '#1A1A24',
          elevated: '#242434',
          overlay: '#2E2E42',
        },
        category: {
          alimentacao: '#FF6B6B',
          delivery: '#FF9A3C',
          transporte: '#4ECDC4',
          viagem: '#45B7D1',
          entretenimento: '#A78BFA',
          saude: '#34D399',
          beleza: '#F472B6',
          casa: '#FBBF24',
          compras: '#60A5FA',
          investimentos: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108,99,255,0.3)',
        'glow-sm': '0 0 10px rgba(108,99,255,0.2)',
      },
    },
  },
  plugins: [],
}
