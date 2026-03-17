

## Fix: "Envía tu cotización" shown even after bid submitted

### Problem

In `CollapsibleTravelerPackageCard.tsx`, the status message at line 403 only checks `pkg.status === 'matched'` and always shows "Envía tu cotización". It ignores `_assignmentStatus`, so even when the traveler already submitted their bid (`bid_submitted`), the card still tells them to send a quote.

The `TravelerPackageCard.tsx` already handles this correctly by checking `_assignmentStatus` — this component was missed.

### Fix

**File: `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` (lines 403-407)**

Replace the single `matched` message with `_assignmentStatus`-aware messages:

- `bid_submitted` → "✅ Cotización enviada — esperando al comprador"
- `bid_won` → "🎉 ¡El shopper te eligió!"
- `bid_lost` → "❌ Otro viajero fue seleccionado"
- `bid_expired` → "⏰ Asignación expirada"
- `bid_cancelled` → "Asignación cancelada"
- Default (no assignment status / `bid_pending`) → "🔗 Paquete emparejado - Envía tu cotización"

This mirrors the logic already in `TravelerPackageCard.tsx` lines 202-260.

### Files
1. `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` — update lines 403-407

