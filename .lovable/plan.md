

## Fix: Shopper's additional notes not visible in "Tip Asignado" modal

### Problem
The shopper's comment (`additional_notes`) is not shown in the traveler's "Tip Asignado" modal, even though the field exists on the package and the QuoteDialog already has rendering logic for it (line 1031-1034).

### Root cause
In `src/components/Dashboard.tsx` (line 1187-1208), the `packageDetails` prop passed to `QuoteDialog` does **not include `additional_notes`**, even though the component's interface accepts it and renders it.

### Solution

**File: `src/components/Dashboard.tsx`** — Add `additional_notes` to the `packageDetails` prop:

```typescript
// Around line 1207, add:
additional_notes: selectedPackageForQuote.additional_notes || undefined,
```

Single line addition. The QuoteDialog already renders it with a 📝 icon in the traveler's product detail section.

