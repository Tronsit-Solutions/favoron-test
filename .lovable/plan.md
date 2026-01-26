

# Plan: Corregir Documentos No Visibles en Pestaña Docs

## Problema Identificado

Hay dos problemas relacionados:

### Problema 1: Botón "Ver dirección y comprar" aparece cuando no debería
El paquete "cámaras desechables" está en estado `in_transit` y tiene ambos documentos (`purchase_confirmation` y `tracking_info`) guardados en la base de datos, pero el botón sigue apareciendo.

**Causa raíz:** La consulta optimizada en `useOptimizedPackagesData.tsx` no incluye los campos `purchase_confirmation` ni `tracking_info` en el SELECT. Esto hace que:
- `pkg.purchase_confirmation` sea `undefined`
- `pkg.tracking_info` sea `undefined`
- La condición `!pkg.purchase_confirmation || !pkg.tracking_info` sea `true` aunque los documentos existen

### Problema 2: Pestaña "Docs" está vacía
El componente `UploadedDocumentsRegistry` verifica si hay documentos, pero como los campos no se cargan, el conteo es 0 y no muestra nada.

## Datos del paquete (verificados en base de datos)

| Campo | Valor |
|-------|-------|
| ID | 047cae8d-78bc-4f0e-b346-7ea7e4844b5c |
| Status | in_transit |
| purchase_confirmation | { filePath: "...", filename: "favoron-hub-viajes-2026-01-21-pagina-4.png", ... } |
| tracking_info | { trackingNumber: "f3473", timestamp: "2026-01-22T10:37:28.784Z", ... } |

Los documentos EXISTEN en la base de datos, pero no se están cargando en la UI.

## Solución

### Archivo a modificar:
`src/hooks/useOptimizedPackagesData.tsx`

### Cambio:
Agregar los campos faltantes a la consulta SELECT (líneas 102-167):

```typescript
const { data, error } = await supabase
  .from('packages')
  .select(`
    id,
    user_id,
    status,
    item_description,
    item_link,
    estimated_price,
    products_data,
    purchase_origin,
    package_destination,
    matched_trip_id,
    created_at,
    updated_at,
    delivery_deadline,
    delivery_method,
    quote,
    quote_expires_at,
    matched_assignment_expires_at,
    label_number,
    incident_flag,
    rejection_reason,
    wants_requote,
    admin_assigned_tip,
    admin_rejection,
    quote_rejection,
    traveler_rejection,
    confirmed_delivery_address,
    traveler_address,
    matched_trip_dates,
    payment_receipt,
    purchase_confirmation,   // <-- AGREGAR
    tracking_info,           // <-- AGREGAR
    office_delivery,         // <-- AGREGAR (para futuras validaciones)
    traveler_dismissed_at,
    traveler_confirmation,
    additional_notes,
    internal_notes,
    profiles:user_id(...),
    trips:matched_trip_id(...)
  `)
```

## Resultado Esperado

Después del cambio:
1. El paquete "cámaras desechables" NO mostrará el botón "Ver dirección y comprar" (ya que tiene ambos documentos)
2. La pestaña "Docs" mostrará los 2 documentos subidos (confirmación de compra + tracking)

## Impacto

- **Rendimiento:** Mínimo impacto, estos campos JSONB son pequeños comparados con otros ya incluidos como `products_data` y `quote`
- **Riesgo:** Muy bajo, solo agrega campos al SELECT sin modificar lógica existente

