

## Mover inputs del programa de referidos a AdminReferrals

### Cambios

**1. `src/pages/AdminReferrals.tsx`**
- Renombrar título de "Reporte de Referidos" a "Programa de Referidos"
- Agregar los estados y lógica de los inputs (reward amount + referred discount) con sus funciones de carga y guardado desde `app_settings`
- Insertar una Card de configuración entre las KPI cards y la tabla, con los dos inputs (monto reward y descuento referido) y sus botones de guardar

**2. `src/pages/AdminControl.tsx`**
- Eliminar toda la Card "Programa de Referidos" (líneas ~415-477) con los inputs de reward y descuento
- Eliminar los estados asociados (`rewardAmount`, `rewardLoading`, `rewardSaving`, `referredDiscount`, `referredDiscountLoading`, `referredDiscountSaving`) y sus funciones (`handleSaveReward`, `handleSaveReferredDiscount`) y el `useEffect` que los carga
- Eliminar imports que ya no se usen (`Gift`, `Input`, `Label`)
- Actualizar la card de navegación "Reporte de Referidos" a "Programa de Referidos"

