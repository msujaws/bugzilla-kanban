/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background layers
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#141414',
        'bg-tertiary': '#1e1e1e',

        // Accent colors
        'accent-primary': '#3b82f6',
        'accent-success': '#10b981',
        'accent-error': '#ef4444',
        'accent-warning': '#f59e0b',
        'accent-staged': '#F28F16',

        // Text colors
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-tertiary': '#737373',

        // Priority colors (for bug cards)
        'priority-p1': '#dc2626',
        'priority-p2': '#ea580c',
        'priority-p3': '#ca8a04',
        'priority-p4': '#65a30d',
        'priority-p5': '#6b7280',

        // Border color
        border: '#2d2d2d',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-out': 'fadeOut 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
