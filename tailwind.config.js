/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background layers (CSS variables for theming)
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-secondary-50': 'var(--color-bg-secondary-50)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-tertiary-50': 'var(--color-bg-tertiary-50)',

        // Accent colors (CSS variables for theming)
        'accent-primary': 'var(--color-accent-primary)',
        'accent-success': 'var(--color-accent-success)',
        'accent-error': 'var(--color-accent-error)',
        'accent-warning': 'var(--color-accent-warning)',
        'accent-staged': 'var(--color-accent-staged)',

        // Text colors (CSS variables for theming)
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',

        // Priority colors (CSS variables for theming)
        'priority-p1': 'var(--color-priority-p1)',
        'priority-p2': 'var(--color-priority-p2)',
        'priority-p3': 'var(--color-priority-p3)',
        'priority-p4': 'var(--color-priority-p4)',
        'priority-p5': 'var(--color-priority-p5)',

        // Severity indicator colors (CSS variables for theming)
        'severity-s1': 'var(--color-severity-s1)',
        'severity-s2': 'var(--color-severity-s2)',
        'severity-s3': 'var(--color-severity-s3)',
        'severity-s4': 'var(--color-severity-s4)',
        'severity-na': 'var(--color-severity-na)',

        // Border color (CSS variable for theming)
        border: 'var(--color-border)',
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
