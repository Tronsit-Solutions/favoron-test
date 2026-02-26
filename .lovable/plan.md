

## Plan: Remove Terms & Regulation from dashboard dropdown menu

**File: `src/components/dashboard/DashboardHeader.tsx`**
- Remove lines 207-214: the two `DropdownMenuItem` entries for "Términos y Condiciones" and "Regulación Aduanera"
- Clean up unused imports (`FileText`, `Shield`) and handler functions (`handleTermsClick`, `handleRegulationClick`) if they become unused

These items are already accessible from the user profile, so removing them from the dropdown declutters the menu.

