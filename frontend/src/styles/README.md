# TruckTrack Design System

Complete theme and design system for the TruckTrack application.

## 🎨 Color Palette

### Primary Colors (Purple)
```scss
$color-primary-500: #667eea  // Main primary color
```
Used for: Headers, primary buttons, important UI elements

### Secondary Colors (Deep Purple)
```scss
$color-secondary-500: #764ba2  // Main secondary color
```
Used for: Secondary actions, accents in gradients

### Accent Colors (Vibrant Blue)
```scss
$color-accent-500: #3b82f6  // Main accent color
```
Used for: Links, highlights, call-to-action elements

### Semantic Colors

**Success (Green)**
```scss
$color-success-500: #10b981
```
Used for: Success messages, positive status indicators

**Warning (Orange)**
```scss
$color-warning-500: #f59e0b
```
Used for: Warnings, caution messages

**Danger (Red)**
```scss
$color-danger-500: #ef4444
```
Used for: Errors, destructive actions, critical alerts

**Info (Blue)**
```scss
$color-info-500: #3b82f6
```
Used for: Information messages, tips

## 📐 Spacing System

```scss
$spacing-xs:  4px
$spacing-sm:  8px
$spacing-md:  16px
$spacing-lg:  24px
$spacing-xl:  32px
$spacing-2xl: 48px
$spacing-3xl: 64px
```

## 🔤 Typography

### Font Families
- **Base**: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif
- **Heading**: 'Inter', 'Roboto', 'Helvetica Neue', Arial, sans-serif
- **Monospace**: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace

### Font Sizes
```scss
$font-size-xs:   0.75rem   // 12px
$font-size-sm:   0.875rem  // 14px
$font-size-base: 1rem      // 16px
$font-size-lg:   1.125rem  // 18px
$font-size-xl:   1.25rem   // 20px
$font-size-2xl:  1.5rem    // 24px
$font-size-3xl:  1.875rem  // 30px
$font-size-4xl:  2.25rem   // 36px
```

### Font Weights
```scss
$font-weight-light: 300
$font-weight-normal: 400
$font-weight-medium: 500
$font-weight-semibold: 600
$font-weight-bold: 700
$font-weight-extrabold: 800
```

## 🎯 Using the Theme

### In Component Styles

```scss
// Import the theme
@use 'src/styles/theme' as theme;

.my-component {
  color: theme.$color-primary-500;
  padding: theme.$spacing-md;
  border-radius: theme.$border-radius-lg;
  font-size: theme.$font-size-base;
  font-weight: theme.$font-weight-medium;
}
```

### CSS Variables

The theme also exports CSS custom properties:

```css
.my-element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Utility Classes

Use pre-defined utility classes in templates:

```html
<!-- Text colors -->
<div class="text-primary">Primary text</div>
<div class="text-success">Success text</div>
<div class="text-danger">Danger text</div>

<!-- Background colors -->
<div class="bg-primary">Primary background</div>
<div class="bg-gray">Gray background</div>

<!-- Gradients -->
<div class="gradient-primary">Gradient background</div>

<!-- Shadows -->
<div class="shadow-md">Medium shadow</div>
<div class="shadow-xl">Extra large shadow</div>

<!-- Spacing -->
<div class="p-md">Medium padding</div>
<div class="m-lg">Large margin</div>

<!-- Border radius -->
<div class="rounded-lg">Large border radius</div>
<div class="rounded-full">Fully rounded</div>
```

## 🎨 Gradients

Pre-defined gradient combinations:

```scss
$gradient-primary: linear-gradient(135deg, $color-primary-500 0%, $color-secondary-500 100%);
$gradient-accent: linear-gradient(135deg, $color-accent-500 0%, $color-primary-500 100%);
$gradient-success: linear-gradient(135deg, $color-success-400 0%, $color-success-600 100%);
```

## 🌐 Breakpoints

```scss
$breakpoint-xs: 480px   // Extra small devices
$breakpoint-sm: 640px   // Small devices
$breakpoint-md: 768px   // Medium devices (tablets)
$breakpoint-lg: 1024px  // Large devices (desktops)
$breakpoint-xl: 1280px  // Extra large devices
$breakpoint-2xl: 1536px // 2X large devices
```

## 🎬 Animations

```scss
$transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
$transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1)
$transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1)
```

Utility classes for animations:
- `.fade-in` - Fade in animation
- `.slide-in-up` - Slide up animation
- `.slide-in-down` - Slide down animation

## 📦 Z-Index Layers

```scss
$z-index-dropdown: 1000
$z-index-sticky: 1020
$z-index-fixed: 1030
$z-index-modal-backdrop: 1040
$z-index-modal: 1050
$z-index-popover: 1060
$z-index-tooltip: 1070
```

## 🎯 Best Practices

1. **Always use theme variables** instead of hardcoded colors
2. **Use semantic colors** (success, warning, danger) for status indicators
3. **Maintain consistent spacing** using the spacing system
4. **Use utility classes** for common patterns
5. **Leverage CSS variables** for dynamic theming
6. **Follow the typography scale** for consistent text sizing

## 📝 Examples

### Button with Theme
```scss
.custom-button {
  background: theme.$gradient-primary;
  color: white;
  padding: theme.$spacing-sm theme.$spacing-md;
  border-radius: theme.$border-radius-md;
  font-weight: theme.$font-weight-medium;
  box-shadow: theme.$shadow-md;
  transition: all theme.$transition-base;

  &:hover {
    box-shadow: theme.$shadow-lg;
    transform: translateY(-2px);
  }
}
```

### Card Component
```scss
.card {
  background: white;
  border-radius: theme.$border-radius-lg;
  padding: theme.$spacing-lg;
  box-shadow: theme.$shadow-md;
  border: 1px solid theme.$color-border-light;

  &:hover {
    box-shadow: theme.$shadow-xl;
  }
}
```

### Status Badge
```html
<span class="badge bg-success text-white rounded-full p-sm">Active</span>
<span class="badge bg-warning text-white rounded-full p-sm">Pending</span>
<span class="badge bg-danger text-white rounded-full p-sm">Error</span>
```
