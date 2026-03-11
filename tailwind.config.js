/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        card: '#1c1c1c',
        border: '#2a2a2a',
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        accent: '#f59e0b',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        'text-primary': '#f4f4f5',
        'text-secondary': '#a1a1aa',
        'text-muted': '#52525b',
        // Category colors
        slab: '#6366f1',
        raw: '#8b5cf6',
        seal: '#ec4899',
        shoe: '#f97316',
        aprl: '#14b8a6',
        elec: '#3b82f6',
        coll: '#f59e0b',
      },
    },
  },
  plugins: [],
};
