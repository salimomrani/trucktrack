# Design Tokens Specification

**Feature**: 017-modern-ui-redesign
**Date**: 2025-12-28

## Overview

This document defines the design token system for the TruckTrack modern UI redesign. Design tokens are the atomic values that define the visual language: colors, typography, spacing, shadows, and borders.

---

## 1. Color Tokens

### Primary Palette (Blue)

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `primary-50` | #E3F2FD | `--color-primary-50` | Subtle backgrounds, highlights |
| `primary-100` | #BBDEFB | `--color-primary-100` | Hover backgrounds |
| `primary-200` | #90CAF9 | `--color-primary-200` | Light accents |
| `primary-300` | #64B5F6 | `--color-primary-300` | Secondary button hover |
| `primary-400` | #42A5F5 | `--color-primary-400` | Links hover |
| `primary-500` | #2196F3 | `--color-primary-500` | Links, secondary actions |
| `primary-600` | #1E88E5 | `--color-primary-600` | Primary button hover |
| `primary-700` | #1976D2 | `--color-primary-700` | **PRIMARY** - Main brand |
| `primary-800` | #1565C0 | `--color-primary-800` | Primary button pressed |
| `primary-900` | #0D47A1 | `--color-primary-900` | High contrast needs |

### Neutral Palette (Gray)

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `gray-50` | #F9FAFB | `--color-gray-50` | Page background |
| `gray-100` | #F3F4F6 | `--color-gray-100` | Card borders, dividers |
| `gray-200` | #E5E7EB | `--color-gray-200` | Input borders, disabled bg |
| `gray-300` | #D1D5DB | `--color-gray-300` | Placeholder text |
| `gray-400` | #9CA3AF | `--color-gray-400` | Disabled text |
| `gray-500` | #6B7280 | `--color-gray-500` | Secondary text |
| `gray-600` | #4B5563 | `--color-gray-600` | Body text |
| `gray-700` | #374151 | `--color-gray-700` | Headings |
| `gray-800` | #1F2937 | `--color-gray-800` | Primary text |
| `gray-900` | #111827 | `--color-gray-900` | High emphasis text |

### Semantic Colors

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `success-50` | #ECFDF5 | `--color-success-50` | Success background |
| `success-500` | #10B981 | `--color-success-500` | Success text, icons |
| `success-600` | #059669 | `--color-success-600` | Success emphasis |
| `warning-50` | #FFFBEB | `--color-warning-50` | Warning background |
| `warning-500` | #F59E0B | `--color-warning-500` | Warning text, icons |
| `warning-600` | #D97706 | `--color-warning-600` | Warning emphasis |
| `danger-50` | #FEF2F2 | `--color-danger-50` | Error background |
| `danger-500` | #EF4444 | `--color-danger-500` | Error text, icons |
| `danger-600` | #DC2626 | `--color-danger-600` | Error emphasis |
| `info-50` | #EFF6FF | `--color-info-50` | Info background |
| `info-500` | #3B82F6 | `--color-info-500` | Info text, icons |

### Surface Colors

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `surface-white` | #FFFFFF | `--color-surface-white` | Cards, modals |
| `surface-gray` | #F9FAFB | `--color-surface-gray` | Page background |
| `surface-elevated` | #FFFFFF | `--color-surface-elevated` | Elevated elements |

---

## 2. Typography Tokens

### Font Family

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `font-sans` | 'Inter', system-ui, sans-serif | `--font-family-sans` |
| `font-mono` | 'JetBrains Mono', monospace | `--font-family-mono` |

### Font Size Scale

| Token | Size | CSS Variable | Use Case |
|-------|------|--------------|----------|
| `text-xs` | 11px | `--font-size-xs` | Overlines, tiny labels |
| `text-sm` | 12px | `--font-size-sm` | Captions, timestamps |
| `text-base` | 14px | `--font-size-base` | Body small, table cells |
| `text-md` | 16px | `--font-size-md` | Body default |
| `text-lg` | 18px | `--font-size-lg` | H4, subheadings |
| `text-xl` | 20px | `--font-size-xl` | H3, card titles |
| `text-2xl` | 24px | `--font-size-2xl` | H2, section headers |
| `text-3xl` | 32px | `--font-size-3xl` | H1, page titles |
| `text-4xl` | 48px | `--font-size-4xl` | Display, hero |

### Font Weight

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `font-normal` | 400 | `--font-weight-normal` |
| `font-medium` | 500 | `--font-weight-medium` |
| `font-semibold` | 600 | `--font-weight-semibold` |
| `font-bold` | 700 | `--font-weight-bold` |

### Line Height

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `leading-tight` | 1.2 | `--line-height-tight` | Headings |
| `leading-snug` | 1.35 | `--line-height-snug` | Subheadings |
| `leading-normal` | 1.5 | `--line-height-normal` | Body text |
| `leading-relaxed` | 1.625 | `--line-height-relaxed` | Long-form text |

---

## 3. Spacing Tokens

### Base Unit: 4px

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `space-0` | 0 | `--space-0` | Reset |
| `space-1` | 4px | `--space-1` | Tight gaps |
| `space-2` | 8px | `--space-2` | Default gap |
| `space-3` | 12px | `--space-3` | Input padding |
| `space-4` | 16px | `--space-4` | Card padding |
| `space-5` | 20px | `--space-5` | Large gaps |
| `space-6` | 24px | `--space-6` | Section spacing |
| `space-8` | 32px | `--space-8` | Large sections |
| `space-10` | 40px | `--space-10` | Page margins |
| `space-12` | 48px | `--space-12` | Major breaks |
| `space-16` | 64px | `--space-16` | Page sections |

---

## 4. Shadow Tokens

### Flat Design Shadows (Minimal)

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `shadow-none` | none | `--shadow-none` | Flat elements |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | `--shadow-sm` | Cards at rest |
| `shadow-md` | 0 2px 4px rgba(0,0,0,0.08) | `--shadow-md` | Hover, dropdowns |
| `shadow-lg` | 0 4px 8px rgba(0,0,0,0.10) | `--shadow-lg` | Modals, popovers |
| `shadow-focus` | 0 0 0 2px var(--color-primary-500) | `--shadow-focus` | Focus rings |

---

## 5. Border Tokens

### Border Width

| Token | Value | CSS Variable |
|-------|-------|--------------|
| `border-0` | 0 | `--border-width-0` |
| `border-1` | 1px | `--border-width-1` |
| `border-2` | 2px | `--border-width-2` |

### Border Radius

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `radius-none` | 0 | `--radius-none` | Square elements |
| `radius-sm` | 4px | `--radius-sm` | Chips, tags |
| `radius-md` | 6px | `--radius-md` | Buttons, inputs |
| `radius-lg` | 8px | `--radius-lg` | Cards |
| `radius-xl` | 12px | `--radius-xl` | Modals |
| `radius-full` | 9999px | `--radius-full` | Circles, pills |

### Border Color

| Token | CSS Variable | Use Case |
|-------|--------------|----------|
| `border-default` | `--color-gray-200` | Default borders |
| `border-light` | `--color-gray-100` | Subtle borders |
| `border-focus` | `--color-primary-500` | Focus state |
| `border-error` | `--color-danger-500` | Error state |
| `border-success` | `--color-success-500` | Success state |

---

## 6. Transition Tokens

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `transition-fast` | 100ms ease-out | `--transition-fast` | Active states |
| `transition-base` | 150ms ease-out | `--transition-base` | Hover, focus |
| `transition-slow` | 200ms ease-out | `--transition-slow` | Menus, modals |
| `transition-color` | 150ms linear | `--transition-color` | Color changes |

---

## 7. Z-Index Scale

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `z-dropdown` | 1000 | `--z-dropdown` | Dropdowns |
| `z-sticky` | 1020 | `--z-sticky` | Sticky headers |
| `z-fixed` | 1030 | `--z-fixed` | Fixed elements |
| `z-modal-backdrop` | 1040 | `--z-modal-backdrop` | Modal overlay |
| `z-modal` | 1050 | `--z-modal` | Modals |
| `z-popover` | 1060 | `--z-popover` | Popovers |
| `z-tooltip` | 1070 | `--z-tooltip` | Tooltips |

---

## 8. Breakpoints

| Token | Value | CSS Variable | Use Case |
|-------|-------|--------------|----------|
| `screen-xs` | 480px | `--screen-xs` | Small mobile |
| `screen-sm` | 640px | `--screen-sm` | Mobile |
| `screen-md` | 768px | `--screen-md` | Tablet |
| `screen-lg` | 1024px | `--screen-lg` | Desktop |
| `screen-xl` | 1280px | `--screen-xl` | Large desktop |
| `screen-2xl` | 1536px | `--screen-2xl` | Extra large |

---

## Token Relationships

```
Typography
├── font-family: font-sans (Inter)
├── size: text-md (16px) for body
├── weight: font-normal (400)
└── line-height: leading-normal (1.5)

Buttons
├── padding: space-3 space-4 (12px 16px)
├── radius: radius-md (6px)
├── shadow: shadow-none
└── transition: transition-base

Cards
├── padding: space-4 (16px)
├── radius: radius-lg (8px)
├── shadow: shadow-sm
├── border: 1px border-light
└── background: surface-white

Inputs
├── padding: space-3 (12px)
├── radius: radius-md (6px)
├── border: 1px border-default
└── focus: shadow-focus
```
