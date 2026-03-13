

## Update document type options in registration form

### Changes

**File: `src/pages/Auth.tsx`** (lines 1074-1080)

Update the Select options from "DPI (Guatemala)" to two options:
- `ID` — "Documento de Identidad"
- `Pasaporte` — "Pasaporte"

Change placeholder from "DPI" to "Seleccionar".

**File: `src/components/AuthModal.tsx`** (line 327)

Update label from "DPI o Pasaporte" to "Documento de identidad" for consistency.

**File: `src/components/profile/PersonalInfoForm.tsx`** (line 141)

Update label from "DPI/Pasaporte" to "Documento de identidad" for consistency.

