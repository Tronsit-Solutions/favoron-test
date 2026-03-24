

## Dividir paquetes del viaje en 2 secciones: Confirmados vs En competencia

### Problema actual
El modal carga assignments y luego busca esos package IDs en el array `packages` pasado como prop. Esto es lento porque depende de que el array completo de packages esté disponible, y mezcla paquetes confirmados con los que están en fase de puja en una sola tabla.

### Solución

**Archivo: `src/components/admin/TripPackagesModal.tsx`**

#### 1) Separar en 2 secciones visuales

**Sección 1 — "Paquetes Confirmados"**: Paquetes donde `matched_trip_id === trip.id` (ya asignados, en proceso o completados). Estos se obtienen directamente del array `packages` sin query adicional.

**Sección 2 — "Paquetes en Competencia"**: Assignments con status `bid_pending` o `bid_submitted`. En lugar de buscar en el array `packages`, hacer un query directo a `package_assignments` con join a `packages` para traer los datos necesarios (descripción, valor, tip del assignment).

#### 2) Optimizar el fetch de assignments

Cambiar el `useEffect` actual para que traiga datos completos de la asignación en un solo query:

```ts
supabase
  .from('package_assignments')
  .select(`
    id, package_id, status, admin_assigned_tip, quote,
    packages:package_id (id, item_description, estimated_price, purchase_origin, package_destination, user_id, status, updated_at)
  `)
  .eq('trip_id', trip.id)
  .in('status', ['bid_pending', 'bid_submitted'])
```

Así los datos de la sección 2 son autocontenidos y no dependen del array `packages`.

#### 3) UI de las 2 secciones

- **Confirmados**: Tabla actual con todos los campos (estado, valor, tip, progreso)
- **En Competencia**: Tabla más simple con badge de status del assignment (`bid_pending` / `bid_submitted`), descripción del producto, valor estimado, y tip asignado. Badge `⚡ Compitiendo` ya existente.

#### 4) Actualizar métricas del resumen

Separar los contadores:
- "Confirmados: X" — paquetes directos
- "En competencia: X" — assignments activos
- Mantener totales de valor y tips pero distinguir cuáles son confirmados vs pendientes

### Resultado
- Carga más rápida: los paquetes confirmados se muestran inmediatamente desde el array local
- Los assignments se cargan aparte sin bloquear la vista principal
- Clara separación visual entre lo confirmado y lo que está en fase de puja

