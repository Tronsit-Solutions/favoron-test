

## Clarify order type labels in package request form

### Problem
Users confuse "Compra Online" and "Pedido Personal" — the current descriptions are vague.

### Changes — `src/components/PackageRequestForm.tsx` (lines 736-738, 770-773)

**1. Rename "Compra Online" and update description (line 736-738)**
- Title: **"Compra Online"** → **"Compra en Línea"**
- Description: → **"Compraré en línea y enviaré el paquete al viajero"**

**2. Rename "Pedido Personal" and update description (line 770-773)**
- Title: **"Pedido Personal"** → **"Ya Tengo el Paquete"**
- Description: → **"Ya tengo el artículo y necesito que un viajero lo lleve"**

### Also update matching references
- `src/components/admin/matching/PendingRequestsTab.tsx` line 238-239: update filter labels to match
- Any badge/display text in `CollapsibleTravelerPackageCard.tsx`, `ProductDetailsModal.tsx` that says "Pedido Personal" → "Paquete Físico" or keep as-is for admin context

### Files
1. `src/components/PackageRequestForm.tsx` — update titles + descriptions
2. `src/components/admin/matching/PendingRequestsTab.tsx` — update filter labels

