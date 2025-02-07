/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // Define custom colors for categories if needed
        onyx: {
          50: "#f7f7f7",
          100: "#e3e3e3",
          500: "#737373",
          800: "#262626",
          900: "#171717",
        },
        amethyste: {
          50: "#fdf4ff",
          100: "#fae8ff",
          500: "#d946ef",
          800: "#86198f",
          900: "#701a75",
        },
        topaze: {
          50: "#fefce8",
          100: "#fef9c3",
          500: "#eab308",
          800: "#854d0e",
          900: "#713f12",
        },
        diamant: {
          50: "#faf5ff",
          100: "#f3e8ff",
          500: "#a855f7",
          800: "#6b21a8",
          900: "#581c87",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#171717',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            'h1, h2, h3, h4': {
              color: '#171717',
              fontWeight: '700',
            },
            code: {
              color: '#171717',
              backgroundColor: '#f3f4f6',
              padding: '0.25rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          },
        },
        invert: {
          css: {
            color: '#ededed',
            'h1, h2, h3, h4': {
              color: '#ffffff',
            },
            code: {
              color: '#ffffff',
              backgroundColor: '#374151',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

module.exports = config;