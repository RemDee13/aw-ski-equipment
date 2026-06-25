/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0F1A',
        bg2: '#0E1626',
        surface: '#13203A',
        ink: '#EAF1F7',
        'ink-muted': '#9FB2C4',
        brand: '#E8702A',
        'brand-dark': '#D2611F',
        gear: '#F2C200',
        ice: '#BFE9F5',
        success: '#3FB68B',
        error: '#E3564B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
