

## Analysis: Document Number in Normal Registration

### What's happening

The trigger `handle_new_user` (latest version `20260209`) correctly extracts `document_type` and `document_number` from `raw_user_meta_data` and saves them to the `profiles` table. The `Auth.tsx` signup form also correctly passes these values via `signUp({ options: { data: { document_type, document_number } } })`.

**However, there are two bugs that can cause the document to appear "not saved":**

### Bug 1: Inconsistent document type values
- `Auth.tsx` uses `"ID"` and `"Pasaporte"` as select values
- `CompleteProfile.tsx` / `PersonalInfoForm.tsx` uses `"dpi"` and `"passport"`
- The `isProfileComplete` check doesn't care about document_type value, BUT if a user later edits their profile, the `PersonalInfoForm` won't recognize `"ID"` or `"Pasaporte"` as valid select values, causing the dropdown to show blank -- which may confuse users into thinking nothing was saved.

### Bug 2: No validation before signup
- `documentType` starts as `''` (empty string). If the user doesn't select a type, an empty string is sent to Supabase metadata and saved to `profiles.document_type` as empty string.
- `documentNumber` has `required` on the HTML input but no JS validation in `handleSignUp`, so it could theoretically be submitted empty.
- An empty `document_type` with a valid `document_number` still passes `isProfileComplete` (which only checks `document_number`), but creates inconsistent data.

### Bug 3 (root cause of user complaints): `documentType` defaults to `''`
- If user fills document number but forgets to pick document type from the dropdown, `documentType = ''` is sent
- The trigger saves `document_type = ''` (not NULL)
- This is technically valid but creates confusing UX on CompleteProfile where the dropdown shows blank

### Plan

**1. Align document type values in `Auth.tsx`**
Change Select values from `"ID"` / `"Pasaporte"` to `"dpi"` / `"passport"` to match the rest of the app.

**2. Default `documentType` to `"dpi"` in `Auth.tsx`**
Change `useState('')` to `useState('dpi')` so a type is always selected, matching `CompleteProfile.tsx` behavior.

**3. Add validation in `handleSignUp` for document fields**
Before calling `signUp`, validate that `documentType` is not empty and `documentNumber` is not empty. Show toast error if missing.

### Files to modify
| File | Change |
|---|---|
| `src/pages/Auth.tsx` | Default `documentType` to `"dpi"`, change select values to `"dpi"`/`"passport"`, add validation |

