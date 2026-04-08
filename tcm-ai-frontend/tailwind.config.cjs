/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ancient: {
          tan: '#A67C52',
          cream: '#F8F5E8',
          light: '#F9F6EE',
          dark: '#5C3A21',
          border: '#D4B996'
        }
      },
      fontFamily: {
        chinese: ['"Ma Shan Zheng"', '"Noto Serif SC"', 'serif']
      }
    }
  },
  plugins: []
}
