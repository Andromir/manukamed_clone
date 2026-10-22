/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Jost', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      colors: {
        navy: {
          50: '#f1f4fa',
          100: '#dfe5f2',
          200: '#bfcbe4',
          300: '#90a4cd',
          400: '#5b77ae',
          500: '#3a5891',
          600: '#2a4277',
          700: '#1f3260',
          800: '#16264b',
          900: '#0f1d3c',
          950: '#0a1430',
        },
        gold: {
          50: '#fcf8ee',
          100: '#f7edd3',
          200: '#eedaa5',
          300: '#e3c272',
          400: '#d8ab4d',
          500: '#c9933a',
          600: '#b0762f',
          700: '#8f5a2a',
          800: '#764828',
          900: '#633c25',
        },
        cream: {
          50: '#fdfcf9',
          100: '#f8f5ee',
          200: '#f1ebdf',
          300: '#e6dcc8',
        },
        honey: {
          400: '#f5a524',
          500: '#ef8f0f',
          600: '#d9720a',
        },
      },
      letterSpacing: {
        widest2: '0.25em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'slow-zoom': {
          '0%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in-left': 'slide-in-left 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        marquee: 'marquee 40s linear infinite',
        'slow-zoom': 'slow-zoom 2.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
