# Typography Contract

**Feature**: 017-modern-ui-redesign
**Date**: 2025-12-28

## Font Stack

```scss
$font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
$font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
```

## Type Scale

### Headings

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display | 48px | 700 | 1.1 | -0.02em |
| H1 | 32px | 600 | 1.2 | -0.01em |
| H2 | 24px | 600 | 1.3 | 0 |
| H3 | 20px | 600 | 1.4 | 0 |
| H4 | 18px | 500 | 1.4 | 0 |

### Body Text

| Variant | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Body Large | 16px | 400 | 1.5 |
| Body Default | 14px | 400 | 1.5 |
| Body Small | 12px | 400 | 1.4 |
| Caption | 12px | 400 | 1.4 |
| Overline | 11px | 500 | 1.3 |

### SCSS Mixins

```scss
// Typography mixins
@mixin text-display {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

@mixin text-h1 {
  font-size: 32px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-gray-800);
}

@mixin text-h2 {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-gray-800);
}

@mixin text-h3 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--color-gray-800);
}

@mixin text-h4 {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-gray-700);
}

@mixin text-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-gray-600);
}

@mixin text-body-lg {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-gray-600);
}

@mixin text-caption {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.4;
  color: var(--color-gray-500);
}

@mixin text-overline {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-gray-500);
}
```

### CSS Custom Properties

```scss
:root {
  --font-family-sans: #{$font-family-sans};
  --font-family-mono: #{$font-family-mono};

  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 32px;
  --font-size-4xl: 48px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-snug: 1.35;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
}
```

## Usage Guidelines

### Page Titles
- Use H1 for main page titles
- One H1 per page
- Color: gray-800

### Section Headers
- Use H2 for major sections
- Use H3 for subsections within cards
- Use H4 for form section labels

### Body Text
- Use Body Default (14px) for table cells, lists
- Use Body Large (16px) for standalone paragraphs
- Use Body Small (12px) for dense data

### Labels & Captions
- Use Caption for timestamps, metadata
- Use Overline for category labels, status badges

### Links
- Color: primary-700
- Underline on hover
- Font-weight: inherit (typically 400)
