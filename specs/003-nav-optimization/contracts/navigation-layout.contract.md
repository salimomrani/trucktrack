# Component Contract: Navigation Layout

**Path**: `frontend/src/app/app.component.ts` (layout coordination)

## Overview

L'AppComponent orchestre le layout de navigation : header + sidenav + contenu principal.
Gère le responsive via BreakpointObserver et coordonne l'état de la sidenav.

---

## Layout Structure

```html
<div class="app-layout">
  <!-- Header compact -->
  <app-header (toggleSidenavEvent)="toggleSidenav()" />

  <!-- Main container with sidenav -->
  <mat-sidenav-container class="main-container">
    <!-- Sidenav -->
    <mat-sidenav #sidenav
                 [mode]="sidenavMode()"
                 [opened]="sidenavOpen()"
                 (closed)="onSidenavClosed()">
      <app-sidenav
        [isOpen]="sidenavOpen()"
        [mode]="sidenavMode()"
        [miniMode]="miniMode()"
        (closed)="closeSidenav()"
        (itemClicked)="onNavItemClicked($event)" />
    </mat-sidenav>

    <!-- Main content -->
    <mat-sidenav-content [class.with-mini-sidenav]="miniMode()">
      <main role="main" id="main-content">
        <router-outlet />
      </main>
    </mat-sidenav-content>
  </mat-sidenav-container>
</div>
```

---

## State Signals

| Signal | Type | Initial | Description |
|--------|------|---------|-------------|
| `sidenavOpen` | `WritableSignal<boolean>` | `false` | Sidenav ouvert/fermé |
| `sidenavMode` | `WritableSignal<'side' \| 'over'>` | `'side'` | Mode push vs overlay |
| `miniMode` | `WritableSignal<boolean>` | `false` | Mode icônes only |
| `currentBreakpoint` | `WritableSignal<string>` | `'desktop'` | Breakpoint actuel |

---

## Breakpoint Logic

```typescript
// Injected BreakpointObserver from @angular/cdk/layout

constructor(private breakpointObserver: BreakpointObserver) {
  this.breakpointObserver
    .observe([
      '(max-width: 767px)',   // Mobile
      '(min-width: 768px) and (max-width: 1023px)', // Tablet
      '(min-width: 1024px)'   // Desktop
    ])
    .pipe(takeUntilDestroyed())
    .subscribe(result => {
      if (result.breakpoints['(max-width: 767px)']) {
        this.currentBreakpoint.set('mobile');
        this.sidenavMode.set('over');
        this.miniMode.set(false);
        this.sidenavOpen.set(false);
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1023px)']) {
        this.currentBreakpoint.set('tablet');
        this.sidenavMode.set('over');
        this.miniMode.set(false);
        this.sidenavOpen.set(false);
      } else {
        this.currentBreakpoint.set('desktop');
        this.sidenavMode.set('side');
        this.miniMode.set(true);  // Mini by default on desktop
        this.sidenavOpen.set(true);
      }
    });
}
```

---

## Methods

| Method | Description |
|--------|-------------|
| `toggleSidenav()` | Toggle `sidenavOpen` state |
| `closeSidenav()` | Set `sidenavOpen` to false |
| `onSidenavClosed()` | Handle mat-sidenav closed event |
| `onNavItemClicked(item)` | Close sidenav on mobile after navigation |

---

## SCSS Layout

```scss
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

mat-sidenav {
  width: 240px;

  &.mini {
    width: 56px;
  }
}

mat-sidenav-content {
  flex: 1;
  overflow-y: auto;

  &.with-mini-sidenav {
    margin-left: 56px;
  }
}

// Responsive overrides
@media (max-width: 767px) {
  mat-sidenav {
    width: 280px;
    max-width: 85vw;
  }

  mat-sidenav-content.with-mini-sidenav {
    margin-left: 0;
  }
}
```

---

## Z-Index Stack

| Element | Z-Index | Purpose |
|---------|---------|---------|
| Header | 1000 | Above content, below modals |
| Sidenav backdrop | 1100 | Above header |
| Sidenav panel | 1200 | Above backdrop |
| Dialogs/Modals | 1300+ | Above all |

---

## Skip Link

```html
<!-- First element in app.component.html -->
<a class="skip-link" href="#main-content">
  Aller au contenu principal
</a>
```

```scss
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 9999;

  &:focus {
    left: 50%;
    transform: translateX(-50%);
    top: 10px;
    background: #fff;
    padding: 8px 16px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
}
```

---

## Responsive Summary

| Breakpoint | Header | Sidenav Mode | Sidenav State | Mini Mode |
|------------|--------|--------------|---------------|-----------|
| Mobile | Compact | Over | Closed | No |
| Tablet | Full | Over | Closed | No |
| Desktop | Full | Side | Open | Yes |

---

## Testing Requirements

| Test | Description |
|------|-------------|
| Unit | Breakpoint changes update state correctly |
| Unit | Toggle sidenav inverts open state |
| E2E | Mobile: hamburger opens sidenav overlay |
| E2E | Desktop: sidenav is mini and persistent |
| E2E | Resize window updates layout |
| A11y | Skip link works on focus |
| Perf | Layout shift < 0.1 CLS |
