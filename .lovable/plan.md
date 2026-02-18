

## Preservar el tip asignado en el historial de rechazos del viajero

### Problema
Cuando un viajero rechaza un paquete (especialmente por "tip bajo"), la funcion SQL `traveler_reject_assignment` limpia completamente el tip numerico (`admin_assigned_tip = NULL`, remueve `adminAssignedTip` de `products_data`, y `quote = NULL`). El admin pierde la referencia de cuanto se ofrecio antes y no puede ajustar el tip informadamente para el siguiente viajero.

### Solucion
Guardar el tip que se ofrecio dentro del registro de rechazo (`traveler_rejection` y `admin_actions_log`) antes de limpiarlo. Asi el admin puede ver "Se ofrecieron Q50 y el viajero rechazo por tip bajo" y decidir ofrecer mas.

### Cambios

**1. Funcion SQL `traveler_reject_assignment`**

Modificar la funcion para capturar el tip asignado antes de limpiarlo:

- En el objeto `traveler_rejection`, agregar:
  - `previous_admin_assigned_tip`: valor de `admin_assigned_tip` del paquete
  - `previous_products_tips`: array con los tips por producto de `products_data`
  - `previous_quote_price`: valor de `quote->>'price'` si existia

- En la entrada de `admin_actions_log`, agregar los mismos campos dentro de `additional_data`

Esto no cambia el comportamiento actual (el paquete sigue regresando a `approved` con tips limpiados), solo preserva el historial.

**2. UI: Mostrar el tip previo en el rechazo**

En `src/components/admin/PackageDetailModal.tsx`, dentro de la seccion de "Viajero Rechazo la Asignacion" (linea ~1121), mostrar el tip que se ofrecio si esta disponible en `traveler_rejection.previous_admin_assigned_tip`.

Tambien en `src/components/admin/matching/MatchCard.tsx` o el `AdminMatchDialog.tsx`, cuando se muestra que un paquete fue rechazado previamente, indicar el tip que se ofrecio.

### Detalle tecnico

Cambio en la funcion SQL (migracion):

```text
-- Dentro del UPDATE, modificar traveler_rejection para incluir:
traveler_rejection = jsonb_build_object(
  ... campos existentes ...,
  'previous_admin_assigned_tip', _package_record.admin_assigned_tip,
  'previous_quote_price', _package_record.quote->>'price',
  'previous_products_tips', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'itemDescription', product->>'itemDescription',
        'adminAssignedTip', product->>'adminAssignedTip'
      )
    )
    FROM jsonb_array_elements(COALESCE(_package_record.products_data, '[]'::jsonb)) AS product
    WHERE product->>'adminAssignedTip' IS NOT NULL
  )
)

-- Lo mismo para admin_actions_log.additional_data
```

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/` | Nueva migracion: ALTER FUNCTION para actualizar `traveler_reject_assignment` |
| `src/components/admin/PackageDetailModal.tsx` | Mostrar tip previo en la seccion de rechazo del viajero |
| `src/components/admin/AdminMatchDialog.tsx` | Mostrar tip previo cuando un paquete fue rechazado por un viajero anterior |

