import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        surface: '#0a0a0a',
        'surface-2': '#0e0e0e',
        border: { DEFAULT: '#171717', '2': '#1a1a1a', '3': '#1e1e1e', '4': '#222' },
        accent: { DEFAULT: '#e6a817', text: '#000' },
        text: { DEFAULT: '#fff', muted: '#8a8a8a', dim: '#666', dimmer: '#555' },
        success: '#6ab04c',
        danger: { DEFAULT: '#d94a3d', light: '#ff6b5e' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jet)', 'ui-monospace', 'monospace'],
      },
      maxWidth: { shell: '440px' },
    },
  },
  plugins: [],
} satisfies Config;
