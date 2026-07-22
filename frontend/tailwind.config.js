/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF8F2',
        charcoal: '#111111',
        pastelYellow: '#FEF08A',
        pastelPink: '#FBCFE8',
        pastelPurple: '#E9D5FF',
        pastelBlue: '#BAE6FD',
        pastelGreen: '#BBF7D0',
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #111111',
        'brutal-lg': '8px 8px 0px 0px #111111',
      }
    },
  },
  plugins: [],
}
