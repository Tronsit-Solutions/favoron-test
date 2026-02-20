

## Agregar campo `feedback_completed` a la tabla `packages`

### Idea
Un unico campo booleano en `packages` que indica si el shopper ya termino (o decidio omitir) el flujo de feedback. Esto simplifica toda la logica: si `feedback_completed = true`, el paquete se oculta del dashboard; si es `false`, se mantiene visible.

### Cambios

**1. Migracion de base de datos**

- Agregar columna `feedback_completed` (boolean, default `false`) a la tabla `packages`.
- Marcar todos los paquetes existentes con status `completed` como `feedback_completed = true` para que no aparezcan retroactivamente en dashboards de shoppers.

```text
ALTER TABLE packages ADD COLUMN feedback_completed boolean NOT NULL DEFAULT false;

-- Marcar todos los paquetes historicos completados
UPDATE packages SET feedback_completed = true WHERE status = 'completed';
```

**2. Modificar RLS de `platform_reviews`**

Actualmente la politica de INSERT exige que exista un `traveler_rating` para el paquete. Se debe relajar para permitir insertar si el shopper hizo skip del rating del viajero.

```text
-- Eliminar politica actual
DROP POLICY "Shoppers can review after rating traveler" ON platform_reviews;

-- Nueva politica: solo requiere que el paquete este completed y sea del shopper
CREATE POLICY "Shoppers can review completed packages"
  ON platform_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM packages
      WHERE packages.id = platform_reviews.package_id
      AND packages.user_id = auth.uid()
      AND packages.status = 'completed'
    )
  );
```

**3. Modificar filtro en `src/components/Dashboard.tsx` (2 ubicaciones: lineas ~621 y ~638)**

Cambiar la logica de filtrado para que los paquetes `completed` se muestren si `feedback_completed === false`:

```text
// Antes:
if (pkg.status === 'completed' || pkg.status === 'archived_by_shopper' || ...) return false;

// Despues:
if (pkg.status === 'archived_by_shopper' || pkg.status === 'cancelled') return false;
if (pkg.status === 'completed' && pkg.feedback_completed) return false;
```

**4. Modificar `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**

Agregar botones de "Omitir" en cada paso del flujo de calificacion:

- **Sin traveler rating**: Mostrar "Calificar viajero" + "Omitir" (texto pequeno/link)
- **Sin platform review** (ya sea que califico o hizo skip): Mostrar "Calificar experiencia" + "Omitir"
- Al hacer "Omitir" en el ultimo paso (o en ambos): marcar `feedback_completed = true` en la tabla `packages`
- Al completar el platform review exitosamente: marcar `feedback_completed = true`

Logica de skip del paso 1 (traveler rating):
- No guarda nada en `traveler_ratings`, simplemente avanza al paso 2 usando estado local (`useState`)

Logica de skip del paso 2 (platform review) o completar review:
- Hace `UPDATE packages SET feedback_completed = true WHERE id = pkg.id`
- El paquete desaparece del dashboard en el siguiente render

**5. Modificar `src/components/dashboard/PlatformReviewModal.tsx`**

Al guardar exitosamente la review, tambien marcar `feedback_completed = true` en el paquete.

### Flujo resultante

1. Paquete se marca `completed` -> `feedback_completed = false` (default)
2. Shopper ve el paquete en "Mis Pedidos" con opciones:
   - "Calificar viajero" | "Omitir"
3. Si califica o hace skip -> siguiente paso:
   - "Calificar experiencia" | "Omitir"  
4. Si califica o hace skip -> se marca `feedback_completed = true` -> paquete desaparece
5. Paquetes historicos: ya marcados como `true` por la migracion, nunca aparecen

### Archivos a modificar
- Nueva migracion SQL (campo + update historicos + RLS)
- `src/components/Dashboard.tsx` (filtro en 2 lugares)
- `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx` (botones skip + marcar completado)
- `src/components/dashboard/PlatformReviewModal.tsx` (marcar completado al guardar)

