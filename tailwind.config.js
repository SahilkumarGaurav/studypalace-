/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f4f9',
          100: '#eae8f3',
          200: '#d3cfe6',
          300: '#b0a9d1',
          400: '#8b7fb6',
          500: '#6f5f9e',
          600: '#5b4a84',
          700: '#4b3c6c',
          800: '#3f3359',
          900: '#2a2140',
          950: '#171129',
        },
        brand: {
          50: '#f4f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#a075ff',
          500: '#843dff',
          600: '#7916ff',
          700: '#6b04fd',
          800: '#5a03d5',
          900: '#4b05ad',
          950: '#2c0076',
        },
        gold: {
          50: '#fffaeb',
          100: '#fef0c7',
          200: '#fde08a',
          300: '#fbc94d',
          400: '#faae24',
          500: '#f98d0a',
          600: '#dd6102',
          700: '#b74006',
          800: '#94310c',
          900: '#7a290d',
        },
        mint: {
          50: '#effefa',
          100: '#c8fff2',
          200: '#91ffe6',
          300: '#51f7d5',
          400: '#1ee2bd',
          500: '#06c6a3',
          600: '#02a086',
          700: '#077f6d',
          800: '#0b6558',
          900: '#0e5349',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        display: ['ui-rounded', 'SF Pro Rounded', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,17,41,.06), 0 8px 24px -12px rgba(23,17,41,.18)',
        pop: '0 18px 40px -16px rgba(74,3,213,.45)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        float: 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
