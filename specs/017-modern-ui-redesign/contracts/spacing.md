# Spacing Contract

**Feature**: 017-modern-ui-redesign
**Date**: 2025-12-28

## Base Unit: 4px

All spacing values are multiples of 4px for consistent visual rhythm.

## Spacing Scale

```scss
$space-0:  0;
$space-1:  4px;   // 0.25rem
$space-2:  8px;   // 0.5rem
$space-3:  12px;  // 0.75rem
$space-4:  16px;  // 1rem
$space-5:  20px;  // 1.25rem
$space-6:  24px;  // 1.5rem
$space-8:  32px;  // 2rem
$space-10: 40px;  // 2.5rem
$space-12: 48px;  // 3rem
$space-16: 64px;  // 4rem
```

## CSS Custom Properties

```scss
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

## Component Spacing Standards

### Buttons

| Size | Padding |
|------|---------|
| Small | 8px 12px |
| Medium | 10px 16px |
| Large | 12px 24px |

```scss
.btn-sm { padding: var(--space-2) var(--space-3); }
.btn-md { padding: 10px var(--space-4); }
.btn-lg { padding: var(--space-3) var(--space-6); }
```

### Cards

| Area | Spacing |
|------|---------|
| Container padding | 16px |
| Header/body gap | 12px |
| Action area padding-top | 16px |

```scss
.card {
  padding: var(--space-4);

  &-header {
    margin-bottom: var(--space-3);
  }

  &-actions {
    padding-top: var(--space-4);
    margin-top: var(--space-4);
    border-top: 1px solid var(--color-gray-100);
  }
}
```

### Forms

| Element | Spacing |
|---------|---------|
| Input padding | 12px |
| Field gap (vertical) | 16px |
| Label to input | 6px |
| Input to error | 4px |

```scss
.form-field {
  margin-bottom: var(--space-4);

  label {
    margin-bottom: 6px;
    display: block;
  }

  input {
    padding: var(--space-3);
  }

  .error-message {
    margin-top: var(--space-1);
  }
}
```

### Tables

| Area | Spacing |
|------|---------|
| Cell padding | 12px 16px |
| Header padding | 12px 16px |
| Row gap (if separated) | 8px |

```scss
.table {
  th, td {
    padding: var(--space-3) var(--space-4);
  }
}
```

### Page Layout

| Area | Spacing |
|------|---------|
| Page padding | 24px |
| Section gap | 32px |
| Card grid gap | 16px |
| Content max-width | 1200px |

```scss
.page {
  padding: var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
}

.section {
  margin-bottom: var(--space-8);
}

.card-grid {
  display: grid;
  gap: var(--space-4);
}
```

### Navigation

| Area | Spacing |
|------|---------|
| Header height | 64px |
| Sidebar width (full) | 240px |
| Sidebar width (mini) | 64px |
| Nav item padding | 12px 16px |
| Nav item gap | 4px |

### Modals

| Area | Spacing |
|------|---------|
| Modal padding | 24px |
| Header/content gap | 16px |
| Content/footer gap | 24px |
| Button gap | 12px |

```scss
.modal {
  padding: var(--space-6);

  &-header {
    margin-bottom: var(--space-4);
  }

  &-footer {
    margin-top: var(--space-6);
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
  }
}
```

## Gap Utilities

```scss
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
```
