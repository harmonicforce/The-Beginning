/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Design tokens from The Beginning Work Order v1.0
        bg: {
          primary:   '#0a0a0a',
          secondary: '#141414',
          elevated:  '#1c1c1c',
        },
        border: '#27272a',
        accent: {
          purple: '#6366f1',
          green:  '#22c55e',
          red:    '#ef4444',
          amber:  '#f59e0b',
        },
        text: {
          primary:   '#f4f4f5',
          secondary: '#a1a1aa',
          muted:     '#52525b',
        },
        // Category colors from reseller_v4_final.jsx
        cat: {
          shoe: '#FF6B35',
          slab: '#FFD700',
          raw:  '#00E5FF',
          seal: '#69FF47',
          aprl: '#BF5AF2',
          elec: '#0A84FF',
          coll: '#FF375F',
        },
      },
    },
  },
  plugins: [],
};
