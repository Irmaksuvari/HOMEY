/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--color-white) / <alpha-value>)',
        black: 'rgb(var(--color-black) / <alpha-value>)',
        zinc: {
          50: 'rgb(var(--color-zinc-50) / <alpha-value>)',
          100: 'rgb(var(--color-zinc-100) / <alpha-value>)',
          200: 'rgb(var(--color-zinc-200) / <alpha-value>)',
          300: 'rgb(var(--color-zinc-300) / <alpha-value>)',
          400: 'rgb(var(--color-zinc-400) / <alpha-value>)',
          500: 'rgb(var(--color-zinc-500) / <alpha-value>)',
          600: 'rgb(var(--color-zinc-600) / <alpha-value>)',
          700: 'rgb(var(--color-zinc-700) / <alpha-value>)',
          800: 'rgb(var(--color-zinc-800) / <alpha-value>)',
          900: 'rgb(var(--color-zinc-900) / <alpha-value>)',
          950: 'rgb(var(--color-zinc-950) / <alpha-value>)',
        },
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        charcoal: 'rgb(var(--color-charcoal) / <alpha-value>)',
        sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
        pastelYellow: 'rgb(var(--color-pastel-yellow) / <alpha-value>)',
        pastelPink: 'rgb(var(--color-pastel-pink) / <alpha-value>)',
        pastelPurple: 'rgb(var(--color-pastel-purple) / <alpha-value>)',
        pastelBlue: 'rgb(var(--color-pastel-blue) / <alpha-value>)',
        pastelGreen: 'rgb(var(--color-pastel-green) / <alpha-value>)',
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px rgb(var(--color-charcoal))',
        'brutal-lg': '8px 8px 0px 0px rgb(var(--color-charcoal))',
      }
    },
  },
  plugins: [],
}
