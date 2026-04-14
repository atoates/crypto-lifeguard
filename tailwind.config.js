/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
      },
      colors: {
        clg: {
          black:   '#14202E',
          grey100: '#1E2E3D',
          grey50:  '#6D7A8A',
          grey10:  '#E1E8F0',
          blue:    '#1C4E7F',
          blue20:  '#C4D3EB',
          green:   '#3BB4AD',
          green30: '#C4E9E6',
          red:     '#B72B29'
        }
      }
    }
  },
  plugins: []
}
