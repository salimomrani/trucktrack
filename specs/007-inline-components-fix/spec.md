# Feature Specification: Fix Inline Components Across Codebase

**Feature Branch**: `007-inline-components-fix`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "fix inline components across codebase"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardize Component File Structure (Priority: P1)

As a developer working on the TruckTrack codebase, I need all Angular components to follow a consistent file structure with separate files for template, styles, and logic, so that the codebase is easier to maintain, review, and understand.

**Why this priority**: Code consistency directly impacts developer productivity, code review quality, and onboarding speed. A standardized structure reduces cognitive load when navigating the codebase.

**Independent Test**: Can be verified by running a script that checks all `.component.ts` files use `templateUrl` and `styleUrls` instead of inline `template` and `styles`. Success means zero violations.

**Acceptance Scenarios**:

1. **Given** any component file in the codebase, **When** I open it, **Then** it must have `templateUrl` pointing to a `.html` file and `styleUrls` pointing to a `.scss` file
2. **Given** a component with inline template or styles, **When** the refactoring is applied, **Then** the content is extracted to separate files without any functional changes
3. **Given** the refactored codebase, **When** I run the build, **Then** it compiles successfully with no new errors

---

### User Story 2 - Preserve Existing Functionality (Priority: P1)

As a user of the TruckTrack application, I need all features to work exactly as before after the refactoring, so that my workflow is not disrupted.

**Why this priority**: Refactoring must be transparent to end users. Any regression would undermine the purpose of code quality improvements.

**Independent Test**: Can be verified by running all existing tests and manually testing affected components (admin panels, forms, dialogs). Success means all tests pass and UI behaves identically.

**Acceptance Scenarios**:

1. **Given** any refactored component, **When** I use it in the application, **Then** it displays and behaves identically to before
2. **Given** the complete refactoring, **When** I run the test suite, **Then** all tests pass without modifications to test logic
3. **Given** any form component (user-form, truck-form, group-form), **When** I submit valid/invalid data, **Then** validation and submission work as before

---

### Edge Cases

- What happens when a component has no styles? → Create an empty `.scss` file to maintain consistency
- What happens when inline template uses complex interpolation? → Ensure proper escaping is preserved in the `.html` file
- How does the system handle components with very large templates? → Split if readability is impacted (flag for review)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All component TypeScript files MUST use `templateUrl` instead of inline `template`
- **FR-002**: All component TypeScript files MUST use `styleUrls` instead of inline `styles`
- **FR-003**: Each component MUST have exactly three files: `.component.ts`, `.component.html`, `.component.scss`
- **FR-004**: Extracted template files MUST preserve all Angular syntax, bindings, and control flow
- **FR-005**: Extracted style files MUST preserve all SCSS variables, mixins, and theme references
- **FR-006**: The application MUST build successfully after all refactoring is complete
- **FR-007**: All existing functionality MUST be preserved without behavioral changes

### Affected Components (15 total)

The following components currently use inline templates and/or styles and require refactoring:

**Admin Module (12 components)**:
- `config-page.component.ts`
- `confirm-dialog.component.ts`
- `audit-log.component.ts`
- `breadcrumb.component.ts`
- `data-table.component.ts`
- `group-form.component.ts`
- `group-list.component.ts`
- `stats-dashboard.component.ts`
- `user-form.component.ts`
- `user-list.component.ts`
- `truck-form.component.ts`
- `truck-list.component.ts`

**Features Module (2 components)**:
- `not-found.component.ts`
- `unauthorized.component.ts`

**Examples (1 component)**:
- `truck-list-modern.component.ts`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of components use external template files (0 inline templates remaining)
- **SC-002**: 100% of components use external style files (0 inline styles remaining)
- **SC-003**: Build completes successfully with no new errors or warnings related to templates
- **SC-004**: All existing tests pass without modification
- **SC-005**: Code review time for component changes reduces due to clearer file separation

## Assumptions

- Components with no current styles will receive an empty `.scss` file for consistency
- The project uses Angular CLI conventions for file naming (`kebab-case`)
- SCSS is the preferred stylesheet format (not CSS or LESS)
- The refactoring does not require changes to any business logic
- Developers have agreed on this standard (per CLAUDE.md section 7)

## Out of Scope

- Adding new functionality to any component
- Modifying component logic or behavior
- Creating unit tests for components that don't have them
- Refactoring components that already use external files
- Changing component selectors or module structure
