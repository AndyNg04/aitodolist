import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B5FE9',
          foreground: '#ffffff'
        },
        quiet: '#0f172a'
      }
    }
  },
  plugins: []
};

export default config;
