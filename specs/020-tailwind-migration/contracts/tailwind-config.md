# Tailwind Configuration Contract

**Feature**: 020-tailwind-migration
**Date**: 2025-12-30

## tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Blue - matching current theme)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Main primary
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Danger (Red)
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Main danger
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Success (Green)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Main success
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning (Amber)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',  // Main warning
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Gray (Neutral)
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'dropdown': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class', // Use .form-* classes instead of global reset
    }),
    require('@tailwindcss/typography'),
  ],
}
```

## Base Styles (styles.scss)

```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Custom base layer overrides
@layer base {
  html {
    @apply antialiased;
  }

  body {
    @apply bg-gray-50 text-gray-800;
  }

  // Focus visible for accessibility
  :focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2;
  }
}

// Custom component classes
@layer components {
  // Input base styles
  .input-base {
    @apply w-full px-3 py-2 border border-gray-200 rounded-md
           text-gray-800 placeholder-gray-400
           transition-colors duration-200
           focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none
           disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed;
  }

  .input-error {
    @apply border-danger-500 focus:border-danger-500 focus:ring-danger-500/20;
  }

  // Button variants
  .btn {
    @apply inline-flex items-center justify-center gap-2
           px-4 py-2 rounded-md font-medium
           transition-colors duration-200
           focus:outline-none focus:ring-2 focus:ring-offset-2
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-primary {
    @apply btn bg-primary-500 text-white
           hover:bg-primary-600
           focus:ring-primary-500;
  }

  .btn-secondary {
    @apply btn bg-white border border-gray-300 text-gray-700
           hover:bg-gray-50
           focus:ring-primary-500;
  }

  .btn-danger {
    @apply btn bg-danger-500 text-white
           hover:bg-danger-600
           focus:ring-danger-500;
  }

  .btn-ghost {
    @apply btn text-gray-600
           hover:bg-gray-100
           focus:ring-gray-500;
  }

  // Card styles
  .card {
    @apply bg-white rounded-lg;
  }

  .card-elevated {
    @apply card shadow-card;
  }

  .card-hoverable {
    @apply card transition-shadow hover:shadow-card-hover;
  }

  // Table styles
  .table-base {
    @apply w-full divide-y divide-gray-200;
  }

  .table-header {
    @apply bg-gray-50;
  }

  .table-header-cell {
    @apply px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
  }

  .table-row {
    @apply bg-white;
  }

  .table-row-striped:nth-child(even) {
    @apply bg-gray-50;
  }

  .table-row-hoverable {
    @apply hover:bg-gray-50 transition-colors;
  }

  .table-cell {
    @apply px-4 py-3 whitespace-nowrap text-sm text-gray-800;
  }
}

// Flatpickr custom theme
@layer components {
  .flatpickr-calendar {
    @apply bg-white rounded-lg shadow-dropdown border border-gray-200;
  }

  .flatpickr-day {
    @apply rounded-md transition-colors;

    &.selected {
      @apply bg-primary-500 text-white;
    }

    &:hover:not(.selected) {
      @apply bg-gray-100;
    }

    &.today:not(.selected) {
      @apply border border-primary-500;
    }
  }

  .flatpickr-month {
    @apply bg-transparent;
  }

  .flatpickr-current-month {
    @apply text-gray-800 font-medium;
  }

  .flatpickr-weekday {
    @apply text-gray-500 font-medium;
  }
}

// Toast animations
@layer utilities {
  .toast-enter {
    @apply animate-slide-up;
  }

  .toast-exit {
    @apply animate-fade-out;
  }
}
```

## PostCSS Configuration

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Angular Configuration Updates

```json
// angular.json (partial)
{
  "projects": {
    "frontend": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "src/styles.scss"
            ],
            "stylePreprocessorOptions": {
              "includePaths": ["src/styles"]
            }
          }
        }
      }
    }
  }
}
```
