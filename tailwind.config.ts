import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFEFB',
          100: '#FDFBF5',
          200: '#FAF7EB',
          300: '#F7F3E0',
          400: '#F4EFD5',
          500: '#F1EBCA',
          600: '#C1BCA2',
          700: '#918D7A',
          800: '#605E52',
          900: '#302F29',
        },
        pink: {
          50: '#FFF0F5',
          100: '#FFE5EC',
          200: '#FFCCD9',
          300: '#FFB3C6',
          400: '#FF99B3',
          500: '#FF85A1',
          600: '#E6778F',
          700: '#CC697D',
          800: '#B35A6B',
          900: '#994C59',
        },
        accent: {
          pink: '#FF6B93',
          coral: '#FF8E7F',
          lavender: '#D4BEF8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        handwriting: ['Dancing Script', 'cursive'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(255, 133, 161, 0.1)',
        'soft-lg': '0 10px 40px -10px rgba(255, 133, 161, 0.15)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config