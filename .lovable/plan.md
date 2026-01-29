
# Plan: Limpiar traveler_dismissal al re-asignar paquete a nuevo viaje

## Problema identificado

Cuando un paquete se re-asigna a un nuevo viaje (después de que un match anterior expiró o fue rechazado), el campo `traveler_dismissal` conserva datos del viaje anterior. Esto causa que el paquete se oculte del dashboard del nuevo viajero aunque esté en estado `matched`.

**Afectados actualmente:** 17 paquetes con status `matched` pero ocultos del viajero.

## Solución

Modificar la función `handleMatchPackage` para limpiar los campos de dismissal cuando se asigna un nuevo viaje.

## Cambios a implementar

### Archivo: `src/hooks/useDashboardActions.tsx`

En la función `handleMatchPackage` (líneas 914-921), agregar la limpieza de campos de dismissal:

**Código actual:**
```typescript
const updateData: any = {
  status: 'matched',
  matched_trip_id: tripId,
  quote: null,
  admin_assigned_tip: adminTip,
  traveler_address: travelerAddress,
  matched_trip_dates: matchedTripDates
  // Note: traveler_dismissed_at cleanup removed...
};
```

**Código nuevo:**
```typescript
const updateData: any = {
  status: 'matched',
  matched_trip_id: tripId,
  quote: null,
  admin_assigned_tip: adminTip,
  traveler_address: travelerAddress,
  matched_trip_dates: matchedTripDates,
  // Clear dismissal fields from previous trip assignment
  traveler_dismissal: null,
  traveler_dismissed_at: null
};
```

### Script de limpieza para paquetes existentes

Ejecutar query SQL para corregir los 17 paquetes afectados:

```sql
UPDATE packages
SET 
  traveler_dismissal = NULL,
  traveler_dismissed_at = NULL,
  updated_at = NOW()
WHERE 
  status = 'matched'
  AND matched_trip_id IS NOT NULL
  AND traveler_dismissal IS NOT NULL;
```

## Flujo resultante

```text
+------------------+     +-----------------+     +-------------------+
| Paquete asignado |     | Quote expira    |     | Paquete re-asignado |
| a viaje A        | --> | traveler_dismissal  --> | a viaje B           |
| status: matched  |     | = {quote_expired, |     | status: matched     |
|                  |     |   previous_trip_id: A} |  | traveler_dismissal |
|                  |     |                  |     | = NULL (LIMPIADO)   |
+------------------+     +-----------------+     +-------------------+
```

## Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| Visibilidad en dashboard viajero | Oculto incorrectamente | Visible correctamente |
| Consistencia de datos | Flag obsoleto | Datos actualizados |
| Experiencia del viajero | No ve paquetes asignados | Ve todos sus paquetes |

## Pasos de implementación

1. Modificar `handleMatchPackage` para limpiar campos de dismissal
2. Ejecutar query SQL para corregir los 17 paquetes existentes
3. Verificar que los viajeros afectados vean sus paquetes correctamente
