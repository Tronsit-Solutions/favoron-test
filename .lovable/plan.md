
Objetivo: dejar de “adivinar” el bug del match y convertirlo en un flujo trazable, reproducible y acotado para arreglarlo rápido.

Qué nos dice el código actual:
- El RPC `assign_package_to_travelers` ya está en “happy path” directo con timeout de 5s y recovery solo si falla.
- El problema persistente ya no parece ser solo “la llamada RPC”, sino la coordinación entre:
  - `useDashboardActions.handleMatchPackage`
  - cierre del modal en `AdminDashboard`
  - cambio de tabs a `matching/matches`
  - `AdminMatchingTab` y su `fetchAssignments(...)`
  - realtime + snapshot protection (`recentMatchRef`, `pendingSnapshotRef`)
- Además, `AdminMatchingTab` hace trabajo extra al entrar:
  - llama `expire_old_quotes()` al montar
  - recalcula `relevantPackageIds`
  - hace `fetchAssignments` con debounce de 300ms
- Eso significa que un bug persistente aquí no se arregla bien “tocando un timeout”; la forma eficiente es aislar en qué capa se rompe.

La forma más eficiente para bugs persistentes como este:
1. Reproducir siempre el mismo caso
   - Elegir 1 paquete y 1-2 viajeros concretos.
   - No cambiar varias cosas a la vez.
   - Definir resultado esperado exacto:
     - modal se cierra
     - toast sale
     - paquete desaparece de Solicitudes
     - aparece en Matches
     - assignment existe en DB
2. Instrumentar con un `traceId` por match
   - Generar un ID único por intento.
   - Loggear ese mismo ID en todos los puntos del flujo.
   - Así evitamos logs sueltos imposibles de correlacionar.
3. Medir fronteras, no funciones sueltas
   - Tiempos exactos:
     - click
     - cierre modal
     - RPC start/end
     - recovery start/end
     - update localPackages
     - cambio a tab matches
     - `AdminMatchingTab` mount
     - `fetchAssignments` start/end
     - primer render donde el paquete ya está visible en Matches
4. Confirmar la “fuente de verdad”
   - Si DB ya quedó en `matched` pero UI no refleja, el bug es de sincronización/UI.
   - Si DB no cambió, el bug es de RPC/condiciones de negocio.
5. Aislar una sola capa cada vez
   - Primero confirmar DB.
   - Luego local state.
   - Luego navegación/tab.
   - Luego realtime/snapshots.
   - Luego side effects.

Plan concreto para este proyecto:
1. Añadir trazabilidad end-to-end del match
   - En `useDashboardActions.tsx`:
     - `traceId`
     - logs de RPC start/end/error
     - logs de recovery/polling
     - log final de “DB confirmed”
   - En `AdminDashboard.tsx`:
     - log al cerrar modal
     - log al actualizar `localPackages`
     - log al hacer `setActiveTab("matching")`
     - log al hacer `onMatchingTabChange("matches")`
   - En `AdminMatchingTab.tsx`:
     - log al montar/renderizar
     - log en `fetchAssignments`
     - log del tamaño de `relevantPackageIds`
     - log cuando el paquete aparece en `activeMatches`
2. Añadir una verificación explícita de estado final
   - Después del éxito, comprobar una sola vez:
     - si el paquete está en `localPackages` como `matched`
     - si aparece en `activeMatches`
   - Si no aparece, registrar exactamente qué condición lo excluye.
3. Detectar si el cuello está en la pestaña Matches
   - `AdminMatchingTab` hoy probablemente introduce latencia visible.
   - Revisar especialmente:
     - `expire_old_quotes()` en mount
     - `fetchAssignments` al entrar
     - recálculo de listas grandes
   - Si el problema está ahí, mover trabajo no crítico a background o diferirlo.
4. Detectar sobrescrituras de estado
   - Auditar cuándo `packages` externos vuelven a pisar `localPackages`.
   - Loggear cuándo actúan:
     - `recentMatchRef`
     - snapshot sync
     - realtime admin hook
   - Objetivo: saber si el paquete “hace match” y luego otra capa lo devuelve temporalmente atrás.
5. Corregir con cambios mínimos y verificables
   - Si el problema es UI:
     - no cambiar de tab automáticamente hasta que el estado local esté asentado, o
     - mostrar feedback inmediato sin depender de `AdminMatchingTab`
   - Si el problema es sync:
     - ampliar/ajustar la ventana de protección de mutaciones
     - evitar resync agresivo justo tras un match
   - Si el problema es carga:
     - evitar que Matches dispare consultas pesadas al instante

Qué construiría para arreglarlo rápido:
- Un “debug trace” temporal del flujo de match con un solo `traceId`.
- Un chequeo explícito de “DB ok / UI no ok”.
- Un aislamiento del tab Matches para saber si el retraso real ocurre antes o después del RPC.
- Luego un fix pequeño en la capa exacta culpable, no otro parche global.

Resultado esperado:
- En 1 o 2 reproducciones sabremos si el bug es:
  1. RPC/negocio,
  2. recuperación,
  3. navegación a Matches,
  4. `fetchAssignments`,
  5. realtime/snapshot overwrite.
- Con eso, el arreglo deja de ser ensayo-error y pasa a ser quirúrgico.

Archivos a inspeccionar/ajustar en la siguiente implementación:
- `src/hooks/useDashboardActions.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/admin/AdminMatchingTab.tsx`
- opcionalmente `src/components/admin/AdminMatchDialog.tsx` si queremos capturar el click inicial con `traceId`
