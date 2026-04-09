

## Por qué los matches tardan tanto — Diagnóstico y solución

### Problema raíz

El RPC `assign_package_to_travelers` es rápido (~50ms), pero al hacer `UPDATE packages SET status = 'matched'`, se disparan **18 triggers sincronos** en la tabla `packages`. Aunque usan `pg_net` (no bloqueante para HTTP), varios triggers hacen **queries a profiles/trips** antes de decidir que no aplican, sumando 3-8 segundos de latencia innecesaria.

### Triggers que se ejecutan innecesariamente en transición a `matched`

| Trigger | Problema |
|---------|----------|
| `notify_traveler_package_status` | Consulta `trips` + `profiles` aunque `matched_trip_id` es NULL en multi-asignación |
| `notify_shopper_package_status` | Consulta `profiles` aunque `matched` no genera notificación |
| `notify_admins_payment_receipt` | Se ejecuta en cada UPDATE, chequea `payment_receipt` |
| `handle_assignment_expiration_on_update` | Sin guard para `matched` |
| `set_assignment_expiration` | Sin guard para `matched` |
| `handle_quote_expiration_on_update` | Sin guard para `matched` |
| `set_quote_expiration` | Sin guard para `matched` |
| `packages_auto_in_transit` | Sin guard para `matched` |

### Solución: Agregar early-return guards

Crear una migración SQL que redefina los triggers más pesados con guardias de retorno temprano al inicio de la función. Si el cambio de estado no es relevante para ese trigger, retornar `NEW` inmediatamente sin hacer queries.

**Triggers a optimizar (en orden de impacto):**

1. **`notify_traveler_package_status`** — Agregar al inicio: `IF NEW.matched_trip_id IS NULL THEN RETURN NEW; END IF;` (evita query a trips+profiles en multi-asignación)

2. **`notify_shopper_package_status`** — Agregar guard: si `NEW.status = 'matched'`, retornar inmediatamente (no hay notificación para ese estado)

3. **`notify_admins_payment_receipt`** — Ya tiene guard para `payment_receipt`, pero agregar: `IF NEW.payment_receipt IS NOT DISTINCT FROM OLD.payment_receipt THEN RETURN NEW;` más temprano

4. **`handle_assignment_expiration_on_update`** / **`set_assignment_expiration`** / **`handle_quote_expiration_on_update`** / **`set_quote_expiration`** — Agregar guards: `IF NEW.status IN ('matched', 'approved', 'pending_approval') THEN RETURN NEW; END IF;`

5. **`packages_auto_in_transit`** — Agregar guard: solo procesar si el status relevante cambia

### Impacto esperado

De 3-8 segundos a <1 segundo por match, eliminando ~6-12 queries innecesarias a `profiles` y `trips` por cada operación.

### Detalle técnico

Una sola migración SQL con `CREATE OR REPLACE FUNCTION` para cada función de trigger afectada, agregando las líneas de early-return al inicio del cuerpo de cada función sin alterar su lógica existente.

