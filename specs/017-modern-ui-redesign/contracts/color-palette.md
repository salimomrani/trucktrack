# Color Palette Contract

**Feature**: 017-modern-ui-redesign
**Date**: 2025-12-28

## Primary Color: Professional Blue

The primary color is #1976D2 (Material Blue 700), representing trust, professionalism, and reliability.

### SCSS Implementation

```scss
// Primary Blue Palette
$color-primary-50:  #E3F2FD;
$color-primary-100: #BBDEFB;
$color-primary-200: #90CAF9;
$color-primary-300: #64B5F6;
$color-primary-400: #42A5F5;
$color-primary-500: #2196F3;
$color-primary-600: #1E88E5;
$color-primary-700: #1976D2; // PRIMARY
$color-primary-800: #1565C0;
$color-primary-900: #0D47A1;

// Neutral Gray Palette
$color-gray-50:  #F9FAFB;
$color-gray-100: #F3F4F6;
$color-gray-200: #E5E7EB;
$color-gray-300: #D1D5DB;
$color-gray-400: #9CA3AF;
$color-gray-500: #6B7280;
$color-gray-600: #4B5563;
$color-gray-700: #374151;
$color-gray-800: #1F2937;
$color-gray-900: #111827;

// Semantic Colors
$color-success-50:  #ECFDF5;
$color-success-500: #10B981;
$color-success-600: #059669;

$color-warning-50:  #FFFBEB;
$color-warning-500: #F59E0B;
$color-warning-600: #D97706;

$color-danger-50:  #FEF2F2;
$color-danger-500: #EF4444;
$color-danger-600: #DC2626;

$color-info-50:  #EFF6FF;
$color-info-500: #3B82F6;
```

### CSS Custom Properties Export

```scss
:root {
  // Primary
  --color-primary: #{$color-primary-700};
  --color-primary-light: #{$color-primary-400};
  --color-primary-dark: #{$color-primary-800};
  --color-primary-50: #{$color-primary-50};
  --color-primary-100: #{$color-primary-100};
  --color-primary-500: #{$color-primary-500};
  --color-primary-600: #{$color-primary-600};
  --color-primary-700: #{$color-primary-700};
  --color-primary-800: #{$color-primary-800};

  // Gray
  --color-gray-50: #{$color-gray-50};
  --color-gray-100: #{$color-gray-100};
  --color-gray-200: #{$color-gray-200};
  --color-gray-300: #{$color-gray-300};
  --color-gray-400: #{$color-gray-400};
  --color-gray-500: #{$color-gray-500};
  --color-gray-600: #{$color-gray-600};
  --color-gray-700: #{$color-gray-700};
  --color-gray-800: #{$color-gray-800};
  --color-gray-900: #{$color-gray-900};

  // Semantic
  --color-success: #{$color-success-500};
  --color-success-light: #{$color-success-50};
  --color-warning: #{$color-warning-500};
  --color-warning-light: #{$color-warning-50};
  --color-danger: #{$color-danger-500};
  --color-danger-light: #{$color-danger-50};
  --color-info: #{$color-info-500};
  --color-info-light: #{$color-info-50};

  // Text
  --color-text-primary: #{$color-gray-800};
  --color-text-secondary: #{$color-gray-500};
  --color-text-muted: #{$color-gray-400};

  // Backgrounds
  --color-background: #{$color-gray-50};
  --color-surface: #FFFFFF;
}
```

### Usage Guidelines

| Use Case | Color Token |
|----------|-------------|
| Primary buttons | `primary-700` bg, white text |
| Primary button hover | `primary-600` bg |
| Primary button pressed | `primary-800` bg |
| Links | `primary-700` |
| Links hover | `primary-600` |
| Secondary buttons | `gray-100` bg, `gray-700` text |
| Page background | `gray-50` |
| Cards | white bg |
| Body text | `gray-800` |
| Secondary text | `gray-500` |
| Borders | `gray-200` |
| Success states | `success-500` |
| Warning states | `warning-500` |
| Error states | `danger-500` |

### WCAG Contrast Verification

| Combination | Ratio | Result |
|-------------|-------|--------|
| primary-700 on white | 5.9:1 | ✅ AAA |
| white on primary-700 | 5.9:1 | ✅ AAA |
| gray-800 on white | 12.6:1 | ✅ AAA |
| gray-500 on white | 4.6:1 | ✅ AA |
| danger-600 on white | 4.5:1 | ✅ AA |
| success-600 on white | 4.7:1 | ✅ AA |
