

## Plan: Fix right margin asymmetry on mobile for expired quote status

### Problem
In mobile view, when a package has `quote_expired` status, the "Solicitar Nueva Cotización" button has `pl-5` left padding (line 580) but no matching right padding, creating a visually uneven layout compared to other statuses like `rejected` which have full-width styled containers.

### Fix

**File**: `src/components/dashboard/CollapsiblePackageCard.tsx`, lines 578-593

Wrap the expired quote re-quote button in a styled container (similar to the rejected state banner) instead of leaving it as a bare button inside the `pl-5` action div. This gives it a consistent card-like appearance with proper spacing on both sides.

Replace the bare button with a styled container:
```tsx
{(pkg.status === 'quote_expired' || ...) && onRequestRequote && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
    <p className="text-xs text-amber-700 mb-2">
      La cotización ha expirado. Solicita una nueva cotización.
    </p>
    <Button size="sm" variant="shopper" onClick={...} className="text-xs w-full">
      <RefreshCw className="h-3 w-3" />
      Solicitar Nueva Cotización
    </Button>
  </div>
)}
```

This matches the visual pattern used by the rejected status banner and eliminates the right-margin asymmetry.

