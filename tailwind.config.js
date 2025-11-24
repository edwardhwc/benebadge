/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Allow all bg gradients the AI may generate
    {
      pattern: /(bg|from|via|to)-(red|pink|purple|green|blue|yellow|orange|teal|emerald|cyan|sky|indigo|violet|rose)-(100|200|300|400|500|600|700)/,
    },
    {
      pattern: /bg-gradient-to-(t|b|r|l)/,
    },
    {
      pattern: /(text|border)-(red|pink|purple|green|blue|yellow|orange|teal|emerald|cyan|sky|indigo|violet|rose)-(100|200|300|400|500|600|700)/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
