# Quickstart: Migration Angular Material → Tailwind CSS

**Feature**: 020-tailwind-migration
**Date**: 2025-12-30

## Prerequisites

- Node.js 18+
- Angular CLI 17+
- Existing frontend Angular project with Material

## Step 1: Install Tailwind CSS

```bash
cd frontend

# Install Tailwind and plugins
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography

# Initialize Tailwind config
npx tailwindcss init
```

## Step 2: Configure Tailwind

Copy the configuration from `contracts/tailwind-config.md` to `frontend/tailwind.config.js`.

Create `frontend/postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Step 3: Update Styles Entry Point

Replace `frontend/src/styles.scss`:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;

// Keep Material imports temporarily during migration
// @use '@angular/material' as mat;
// ... existing Material theme ...

// Add component classes from contracts/tailwind-config.md
@layer components {
  // ... copy from contract
}
```

## Step 4: Install Flatpickr

```bash
npm install flatpickr
```

## Step 5: Create First Component (Button)

```bash
# Create component structure
mkdir -p src/app/shared/components/button
```

Create `button.component.ts`:
```typescript
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly clicked = output<MouseEvent>();

  onClick(event: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}
```

Create `button.component.html`:
```html
<button
  [type]="type()"
  [disabled]="disabled() || loading()"
  [class]="getButtonClasses()"
  (click)="onClick($event)">
  @if (loading()) {
    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  }
  <ng-content></ng-content>
</button>
```

Create `button.component.scss`:
```scss
// Component-specific styles if needed
// Most styling handled by Tailwind classes
```

## Step 6: Migrate First Page (Login)

1. Update `login.component.ts` imports:
```typescript
import { ButtonComponent } from '@shared/components/button/button.component';
import { InputComponent } from '@shared/components/input/input.component';

@Component({
  // ...
  imports: [
    // Remove: MatFormFieldModule, MatInputModule, MatButtonModule
    ButtonComponent,
    InputComponent,
    // ... other imports
  ]
})
```

2. Update template to use new components:
```html
<!-- Before (Material) -->
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput formControlName="email">
</mat-form-field>

<!-- After (Tailwind) -->
<app-input
  type="email"
  label="Email"
  [(value)]="email"
  [error]="emailError()">
</app-input>
```

## Step 7: Test Migration

```bash
# Run dev server
npm start

# Run tests
npm test

# Check bundle size
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

## Step 8: Repeat for Each Page

Follow migration order from research.md:
1. Login ✓
2. History
3. Map
4. Analytics
5. Admin pages

## Step 9: Remove Angular Material

After all pages migrated:
```bash
npm uninstall @angular/material

# Keep CDK for overlay/a11y
# @angular/cdk remains installed
```

Update `angular.json` to remove Material theme imports.

## Verification Checklist

- [ ] Tailwind installed and configured
- [ ] Button component created and working
- [ ] Input component created and working
- [ ] Login page migrated
- [ ] No visual regressions (compare screenshots)
- [ ] Accessibility maintained (run Lighthouse)
- [ ] Bundle size reduced

## Common Issues

### 1. Tailwind classes not applying
Check `tailwind.config.js` content paths include `**/*.html` and `**/*.ts`.

### 2. Material styles conflicting
Increase specificity of Tailwind classes or remove Material imports progressively.

### 3. Flatpickr styling issues
Ensure Flatpickr CSS is loaded after Tailwind base styles.

### 4. Focus states missing
Add `focus-visible:` variants to interactive elements for accessibility.

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Flatpickr Docs](https://flatpickr.js.org/)
- [Angular CDK Overlay](https://material.angular.io/cdk/overlay/overview)
- Feature contracts: `specs/020-tailwind-migration/contracts/`
