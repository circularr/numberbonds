/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'rainbow': 'rainbow 6s linear infinite',
        'spin-slow': 'spin 10s linear infinite',
        'sparkle-fade': 'sparkle-fade 1s ease-out forwards'
      },
      keyframes: {
        rainbow: {
          '0%': { backgroundPosition: '0% center', filter: 'hue-rotate(0deg)' },
          '100%': { backgroundPosition: '200% center', filter: 'hue-rotate(360deg)' }
        },
        'sparkle-fade': {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          '50%': { transform: 'scale(1) rotate(180deg)', opacity: 1 },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: 0 }
        }
      },
      fontFamily: {
        'comic-sans': ['"Comic Sans MS"', 'cursive']
      }
    },
  },
  plugins: [],
}
