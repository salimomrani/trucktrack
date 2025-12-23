# Implementation Plan: Fix Inline Components Across Codebase

**Branch**: `007-inline-components-fix` | **Date**: 2025-12-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-inline-components-fix/spec.md`

## Summary

Refactor 15 Angular components from inline templates/styles to separate files. This is a code quality improvement task with no functional changes - purely structural refactoring to enforce the component file structure standard defined in CLAUDE.md section 7.

## Technical Context

**Language/Version**: TypeScript 5.x with Angular 17
**Primary Dependencies**: Angular Material, RxJS
**Storage**: N/A (no data changes)
**Testing**: Angular CLI (`ng test`, `ng build`)
**Target Platform**: Web (Angular SPA)
**Project Type**: Web application (frontend only)
**Performance Goals**: N/A (refactoring task)
**Constraints**: No functional changes allowed
**Scale/Scope**: 15 components to refactor

## Constitution Check

*GATE: This is a code quality refactoring task. No new features, no architectural changes.*

- No new dependencies added
- No behavioral changes
- Follows existing project patterns

## Project Structure

### Documentation (this feature)

```text
specs/007-inline-components-fix/
├── spec.md              # Feature specification
├── plan.md              # This file
├── checklists/          # Quality checklists
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Task breakdown (to be generated)
```

### Source Code (affected files)

```text
frontend/src/app/
├── admin/
│   ├── config/
│   │   └── config-page.component.{ts,html,scss}
│   ├── dashboard/
│   │   └── stats-dashboard.component.{ts,html,scss}
│   ├── groups/
│   │   ├── group-form/group-form.component.{ts,html,scss}
│   │   └── group-list/group-list.component.{ts,html,scss}
│   ├── shared/
│   │   ├── audit-log/audit-log.component.{ts,html,scss}
│   │   ├── breadcrumb/breadcrumb.component.{ts,html,scss}
│   │   ├── confirm-dialog/confirm-dialog.component.{ts,html,scss}
│   │   └── data-table/data-table.component.{ts,html,scss}
│   ├── trucks/
│   │   ├── truck-form/truck-form.component.{ts,html,scss}
│   │   └── truck-list/truck-list.component.{ts,html,scss}
│   └── users/
│       ├── user-form/user-form.component.{ts,html,scss}
│       └── user-list/user-list.component.{ts,html,scss}
├── features/
│   ├── auth/unauthorized/unauthorized.component.{ts,html,scss}
│   └── not-found/not-found.component.{ts,html,scss}
└── examples/
    └── truck-list-modern.component.{ts,html,scss}
```

**Structure Decision**: No structural changes. Each component gets 2 new files (.html, .scss) extracted from inline content in .ts file.

## Complexity Tracking

No violations - this is a straightforward refactoring task.
