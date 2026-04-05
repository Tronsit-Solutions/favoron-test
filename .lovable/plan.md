
Objetivo: volver el match a la sensación “instantánea” que tenía antes del multiassignment, sin quitar la arquitectura de `package_assignments`.

Diagnóstico de código
- El RPC principal ya está simplificado: `src/hooks/useDashboardActions.tsx` solo llama `assign_package_to_travelers`.
- El cuello de botella ahora no parece ser el RPC, sino la capa de UI/lectura añadida con multiassignment:
  - `src/components/admin/AdminMatchingTab.tsx` ejecuta `expire_old_quotes()` al montar.
  - Ese mismo componente hace fetch global de `package_assignments` para muchos paquetes “relevantes”, con debounce, cada vez que cambia `packages`.
  - El tab “pending” sigue cargando lógica de multiassignment aunque para confirmar un match solo necesitamos: actualizar `packages.status = 'matched'` y crear filas en `package_assignments`.
  - `src/components/admin/AdminMatchDialog.tsx` mantiene hidratación pesada de datos de viajeros/asignaciones que no es necesaria para cerrar el match.

Plan de implementación
1. Separar completamente el flujo “Pendientes” del flujo “Matches”
- En `AdminMatchingTab.tsx`, el tab `pending` dejará de depender de `assignmentsMap`.
- “Pendientes” se calculará solo desde `packages` por estado.
- La carga de `package_assignments` pasará a ser lazy y solo ocurrirá cuando el admin entre al tab `matches`.

2. Quitar el trabajo global del render de matching
- Eliminar `supabase.rpc('expire_old_quotes')` del montaje de `AdminMatchingTab`.
- Ese cleanup debe salir del render-path del admin; lo moveré a un mecanismo manual/background para que no compita con el match.
- También eliminaré el fetch global/debounced de asignaciones mientras el admin está en `matching=pending`.

3. Hacer que el match solo haga la operación mínima visible
- Mantener el RPC `assign_package_to_travelers` como operación atómica única.
- Tras éxito:
  - cerrar modal,
  - marcar el paquete localmente como `matched`,
  - quitarlo de “Pendientes” de inmediato,
  - no disparar refresh global del dashboard,
  - no esperar a hidratar `package_assignments`.

4. Reducir la carga del `AdminMatchDialog`
- Mantener solo lo necesario para confirmar: `selectedTripIds`, tip y productos con tip.
- Dejar datos secundarios de viajeros/asignaciones como carga bajo demanda al expandir detalles, no como parte del flujo crítico de confirmación.

5. Mantener multiassignment, pero con lectura diferida
- El multiassignment seguirá existiendo igual en DB:
  - se insertan filas en `package_assignments`,
  - el paquete pasa a `matched`.
- Lo que cambia es cuándo se leen/escanéan esas asignaciones: después, cuando realmente hacen falta.

Archivos a tocar
- `src/components/admin/AdminMatchingTab.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/admin/AdminMatchDialog.tsx`
- Opcionalmente, una mejora pequeña en el RPC para devolver un resumen más útil al cliente, pero sin cambiar la lógica de negocio.

Resultado esperado
- Confirmar match vuelve a sentirse inmediato.
- El paquete desaparece al instante de “Pendientes”.
- Las filas en `package_assignments` se siguen creando igual.
- El costo de multiassignment se mueve fuera del camino crítico y solo se paga al entrar a “Matches”.

Detalle técnico
```text
Antes:
Confirmar Match
→ RPC
→ refreshes / scans globales / expire_old_quotes / fetchAssignments
→ UI termina tarde

Después:
Confirmar Match
→ RPC
→ update local package.status = matched
→ remover de Pendientes
→ cargar asignaciones solo si luego abren “Matches”
```
