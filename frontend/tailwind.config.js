/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { fontFamily: { sans: ['DM Sans', 'sans-serif'], serif: ['Instrument Serif', 'serif'], mono: ['DM Mono', 'monospace'] } } },
  plugins: []
}
