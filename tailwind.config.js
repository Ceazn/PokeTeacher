/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand palette (expand as design evolves)
        brand: {
          primary: '#E8243C',   // Pokémon red
          dark:    '#1A1A2E',
          surface: '#16213E',
          border:  '#0F3460',
        },
      },
    },
  },
  plugins: [],
};
