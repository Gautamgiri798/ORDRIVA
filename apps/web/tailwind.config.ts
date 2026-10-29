import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ordriva: {
          navy: '#172554',
          teal: '#0F766E',
          tealHover: '#0D6861',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          surface: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          muted: '#64748B',
          border: '#E2E8F0',
        },
      },
      borderRadius: {
        card: '12px',
        control: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

