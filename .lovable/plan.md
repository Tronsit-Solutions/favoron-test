

## Unificar comportamiento de cancelacion completa

### Problema actual
Hay dos flujos de cancelacion completa que se comportan diferente:

1. **`deletePackage` (usePackagesData.tsx)**: Limpia `matched_trip_id`, `quote`, `quote_expires_at`, `matched_trip_dates`, `traveler_address` -- esto borra la referencia al viajero, haciendo imposible el rastreo financiero.
2. **`PackageCancellationModal`**: Solo cambia status a `cancelled` y agrega `rejection_reason` -- preserva la referencia al viajero.

### Solucion

**El `PackageCancellationModal` ya tiene el comportamiento correcto.** El problema esta en `deletePackage` y en `handleDiscardPackage`/`handleArchivePackage` que tambien cancelan paquetes sin preservar la info del viajero.

### Cambios a realizar

**1. `src/hooks/usePackagesData.tsx` - Funcion `deletePackage`**
- Dejar de limpiar `matched_trip_id`, `quote`, `matched_trip_dates`, `traveler_address`
- Solo cambiar status a `cancelled` y limpiar `quote_expires_at` (para que no aparezca como timer activo)

**2. `src/components/admin/FinancialSummaryTable.tsx` - Incluir paquetes cancelados**
- Agregar `cancelled` a la lista de estados elegibles para que el pago original siga visible junto al reembolso negativo

**3. Visibilidad en dashboard del viajero (sin cambios necesarios)**
- La logica de filtrado en "Mis Viajes" (lineas 878-906 de Dashboard.tsx) ya excluye paquetes `cancelled` -- solo muestra estados post-pago, timers activos y cotizaciones expiradas
- Los paquetes cancelados no apareceran en el dashboard del viajero aunque se preserve `matched_trip_id`

### Resumen tecnico

```text
Antes (deletePackage):
  status -> cancelled
  matched_trip_id -> null      (pierde referencia al viajero)
  quote -> null                (pierde info financiera)
  matched_trip_dates -> null
  traveler_address -> null

Despues (deletePackage):
  status -> cancelled
  quote_expires_at -> null     (evita timers activos)
  (todo lo demas se preserva para auditoria financiera)
```

El viajero no vera el paquete cancelado porque el filtro de visibilidad solo muestra estados activos/post-pago. La tabla financiera si lo mostrara para tener el registro completo de ingresos y reembolsos.
