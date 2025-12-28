# Component Style Contracts

**Feature**: 017-modern-ui-redesign
**Date**: 2025-12-28

## Design Principles

- **Flat Design**: Minimal shadows, no gradients
- **Subtle Accents**: Light shadows, thin borders
- **Consistent States**: Uniform hover, focus, active, disabled states
- **WCAG 2.1 AA**: All interactive elements accessible

---

## Buttons

### Primary Button

```scss
.btn-primary {
  // Base
  background-color: var(--color-primary-700);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 16px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 150ms ease-out;

  // Hover
  &:hover {
    background-color: var(--color-primary-600);
  }

  // Active
  &:active {
    background-color: var(--color-primary-800);
  }

  // Focus
  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  // Disabled
  &:disabled {
    background-color: var(--color-gray-200);
    color: var(--color-gray-400);
    cursor: not-allowed;
  }
}
```

### Secondary Button

```scss
.btn-secondary {
  background-color: white;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  padding: 10px 16px;
  font-weight: 500;
  transition: all 150ms ease-out;

  &:hover {
    background-color: var(--color-gray-50);
    border-color: var(--color-gray-300);
  }

  &:active {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  &:disabled {
    background-color: var(--color-gray-50);
    color: var(--color-gray-400);
    border-color: var(--color-gray-200);
    cursor: not-allowed;
  }
}
```

### Text Button (Tertiary)

```scss
.btn-text {
  background: none;
  color: var(--color-primary-700);
  border: none;
  padding: 8px 12px;
  font-weight: 500;
  transition: color 150ms ease-out;

  &:hover {
    color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
}
```

---

## Cards

```scss
.card {
  // Base
  background: white;
  border: 1px solid var(--color-gray-100);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  transition: box-shadow 150ms ease-out;

  // Interactive (clickable cards)
  &.card-interactive {
    cursor: pointer;

    &:hover {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary-500);
      outline-offset: 2px;
    }
  }

  // Card Header
  &-header {
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-gray-100);

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--color-gray-800);
    }
  }

  // Card Body
  &-body {
    color: var(--color-gray-600);
    font-size: 14px;
    line-height: 1.5;
  }

  // Card Footer
  &-footer {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--color-gray-100);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}
```

---

## Form Inputs

```scss
.form-input {
  // Base
  width: 100%;
  padding: 12px;
  font-size: 14px;
  color: var(--color-gray-800);
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: 6px;
  transition: border-color 150ms ease-out, box-shadow 150ms ease-out;

  // Placeholder
  &::placeholder {
    color: var(--color-gray-400);
  }

  // Hover
  &:hover:not(:focus):not(:disabled) {
    border-color: var(--color-gray-300);
  }

  // Focus
  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px var(--color-primary-50);
  }

  // Error
  &.input-error {
    border-color: var(--color-danger-500);

    &:focus {
      box-shadow: 0 0 0 3px var(--color-danger-50);
    }
  }

  // Success
  &.input-success {
    border-color: var(--color-success-500);
  }

  // Disabled
  &:disabled {
    background: var(--color-gray-50);
    color: var(--color-gray-400);
    cursor: not-allowed;
  }
}

// Form Label
.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-700);
}

// Form Error Message
.form-error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-danger-500);
}

// Form Hint
.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-gray-500);
}
```

---

## Data Tables

```scss
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid var(--color-gray-100);
  border-radius: 8px;
  overflow: hidden;

  // Header
  th {
    padding: 12px 16px;
    text-align: left;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--color-gray-50);
    border-bottom: 1px solid var(--color-gray-200);
  }

  // Cells
  td {
    padding: 12px 16px;
    font-size: 14px;
    color: var(--color-gray-700);
    border-bottom: 1px solid var(--color-gray-100);
  }

  // Row Hover
  tbody tr {
    transition: background-color 100ms ease-out;

    &:hover {
      background: var(--color-gray-50);
    }

    &:last-child td {
      border-bottom: none;
    }
  }

  // Clickable Rows
  &.table-clickable tbody tr {
    cursor: pointer;
  }
}
```

---

## Status Badges

```scss
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;

  // Variants
  &-success {
    background: var(--color-success-50);
    color: var(--color-success-600);
  }

  &-warning {
    background: var(--color-warning-50);
    color: var(--color-warning-600);
  }

  &-danger {
    background: var(--color-danger-50);
    color: var(--color-danger-600);
  }

  &-info {
    background: var(--color-info-50);
    color: var(--color-primary-700);
  }

  &-neutral {
    background: var(--color-gray-100);
    color: var(--color-gray-600);
  }
}
```

---

## Navigation

### Header

```scss
.header {
  height: 64px;
  background: white;
  border-bottom: 1px solid var(--color-gray-100);
  display: flex;
  align-items: center;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 1030;
}
```

### Sidenav

```scss
.sidenav {
  width: 240px;
  background: white;
  border-right: 1px solid var(--color-gray-100);
  height: 100vh;
  position: fixed;
  top: 64px;
  left: 0;
  overflow-y: auto;
  padding: 16px 0;

  // Mini mode
  &.sidenav-mini {
    width: 64px;

    .nav-label {
      display: none;
    }
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--color-gray-600);
  text-decoration: none;
  transition: all 150ms ease-out;
  margin: 4px 8px;
  border-radius: 6px;

  &:hover {
    background: var(--color-gray-50);
    color: var(--color-gray-800);
  }

  &.active {
    background: var(--color-primary-50);
    color: var(--color-primary-700);
  }

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
}
```

---

## Modals

```scss
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1040;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  z-index: 1050;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;

  &-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--color-gray-800);
    }
  }

  &-body {
    color: var(--color-gray-600);
    font-size: 14px;
    line-height: 1.5;
  }

  &-footer {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
}
```

---

## Loading States

```scss
// Spinner
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Skeleton
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 25%,
    var(--color-gray-50) 50%,
    var(--color-gray-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Button Loading
.btn-loading {
  position: relative;
  color: transparent;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    top: 50%;
    left: 50%;
    margin-top: -8px;
    margin-left: -8px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}
```

---

## Empty States

```scss
.empty-state {
  text-align: center;
  padding: 48px 24px;

  &-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    color: var(--color-gray-300);
  }

  &-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-gray-700);
    margin-bottom: 8px;
  }

  &-description {
    font-size: 14px;
    color: var(--color-gray-500);
    margin-bottom: 24px;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }
}
```
