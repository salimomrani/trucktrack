# Quickstart: Frontend i18n FR/EN

**Feature**: 021-frontend-i18n
**Date**: 2026-01-06

## Prerequisites

- Node.js 18+
- Angular CLI
- Frontend running (`cd frontend && npm start`)

## Quick Test Scenarios

### Scenario 1: Language Switching (US1)

**Steps**:
1. Open http://localhost:4200
2. Login with `admin@trucktrack.com` / `AdminPass123!`
3. Locate language selector in header (next to theme toggle)
4. Click on "EN" (or English flag)
5. Verify all interface texts change to English instantly
6. Click on "FR" to switch back to French

**Expected Results**:
- Language switches without page reload
- All visible text changes (sidebar, header, page content)
- Switch completes in <500ms

### Scenario 2: Preference Persistence (US2)

**Steps**:
1. Set language to English
2. Close browser tab
3. Open new tab to http://localhost:4200
4. Login again

**Expected Results**:
- Interface displays in English (last selected language)
- No need to re-select language

### Scenario 3: Admin Pages Translation (US3)

**Steps**:
1. Set language to English
2. Navigate to each admin section:
   - Dashboard
   - Trucks
   - Trips
   - Users
   - Groups
   - Configuration
3. For each section, verify:
   - Page title is translated
   - Table column headers are translated
   - Buttons (Add, Edit, Delete) are translated
   - Form labels are translated

**Expected Results**:
- 100% of static texts are translated
- No French text appears when English is selected

### Scenario 4: Toast Messages Translation (US4)

**Steps**:
1. Set language to English
2. Go to Trucks page
3. Create a new truck
4. Verify success toast message is in English
5. Try to submit an invalid form
6. Verify validation errors are in English

**Expected Results**:
- Success messages: "Saved successfully", "Deleted successfully"
- Error messages: "Please check the form fields", "Connection error"

### Scenario 5: Date Formatting

**Steps**:
1. Set language to French
2. Go to Trips page
3. Note date format (should be DD/MM/YYYY)
4. Switch to English
5. Note date format (should be MM/DD/YYYY)

**Expected Results**:
- FR: 06/01/2026 (jour/mois/année)
- EN: 01/06/2026 (month/day/year)

## Development Commands

```bash
# Start frontend
cd frontend && npm start

# Run tests
cd frontend && npm test

# Build production
cd frontend && npm run build
```

## Translation Files Location

```
frontend/src/assets/i18n/
├── fr.json    # French (default)
└── en.json    # English
```

## Adding New Translations

1. Add key to both `fr.json` and `en.json`
2. Use in template: `{{ 'KEY.PATH' | translate }}`
3. Use in component: `this.translate.instant('KEY.PATH')`

## Common Translation Keys

| Key | FR | EN |
|-----|----|----|
| `COMMON.SAVE` | Enregistrer | Save |
| `COMMON.CANCEL` | Annuler | Cancel |
| `COMMON.DELETE` | Supprimer | Delete |
| `COMMON.EDIT` | Modifier | Edit |
| `COMMON.SEARCH` | Rechercher | Search |
| `NAV.DASHBOARD` | Tableau de bord | Dashboard |
| `NAV.TRUCKS` | Camions | Trucks |
| `NAV.TRIPS` | Trajets | Trips |
