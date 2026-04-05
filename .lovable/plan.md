
Objetivo: investigar y corregir el cuello de botella real del match para que el flujo normal quede en 2–3 segundos, sin romper la resiliencia cuando falle la red.

Qué he encontrado en el código:
- El RPC `assign_package_to_travelers` en SQL es simple y atómico: filtra viajeros ya activos, inserta filas en `package_assignments` y actualiza `packages.status = 'matched'`. No hace notificaciones ni trabajo pesado en DB.
- Por tanto, si a veces tarda mucho, el problema no parece ser “crear assignments”, sino el flujo defensivo y de sincronización alrededor del RPC.
- Ahora mismo hay varias capas que pueden alargar muchísimo un fallo o una respuesta perdida:
  1. `withRetry(..., { maxRetries: 1, baseDelay: 500 })`
  2. `Promise.race` con timeout de 8s
  3. `waitForMatchConfirmation()` con polling de hasta 6s
  4. En `AdminDashboard`, si falla, se vuelve a consultar `packages.status`
- Eso explica por qué algunos casos pueden dispararse muy por encima de 2–3s: cuando la respuesta del RPC se pierde, el cliente entra en timeout + polling + verificación extra.
- Además, el flujo UI hace más trabajo después del éxito:
  - cambia tabs automáticamente a `matches`
  - refresca listas derivadas
  - `AdminMatchingTab` vuelve a consultar `package_assignments` con debounce
  - realtime y protección de snapshots pueden volver a tocar estado local
- Las notificaciones WhatsApp/email e historial están diferidas con `setTimeout(500)`, así que no deberían bloquear el éxito inicial, aunque siguen generando actividad de red y escrituras poco después.

Conclusión:
- Tu planteamiento es correcto para el caso ideal: el match debería ser casi inmediato porque el RPC hace poco.
- Pero hoy el sistema está optimizado para “recuperarse” de respuestas perdidas, no para minimizar latencia observable.
- El cuello de botella probable no es la inserción SQL sino la suma de:
  - timeout/retry/polling de resiliencia
  - verificación duplicada en el dashboard
  - navegación/recálculo del tab de matches tras éxito
  - resincronización por realtime y queries derivadas

Plan de implementación propuesto:
1. Instrumentar el flujo de match con timestamps precisos
   - Medir: click → inicio RPC → fin RPC → cierre modal → toast → cambio de tab → render de matches.
   - Añadir logs temporales en `AdminMatchDialog`, `AdminDashboard`, `useDashboardActions` y `AdminMatchingTab`.
   - Así sabremos si el retraso está en RPC, recuperación post-error, cambio de tab o rerender/query del tab.

2. Separar “happy path” de “recovery path”
   - Mantener defensas, pero solo para errores reales.
   - Si el RPC responde bien, salir inmediatamente sin verificaciones extra.
   - Si hay timeout/red caída, entonces sí activar polling de confirmación.
   - Revisar que no haya segunda verificación redundante en `AdminDashboard` cuando `handleMatchPackage` ya recuperó el estado.

3. Reducir coste visible del post-match en UI
   - Evitar que el cambio automático a tab `matches` bloquee la percepción de rapidez.
   - Mantener update local optimista del paquete y posponer cualquier refresco pesado.
   - Revisar si `AdminMatchingTab` dispara un fetch de assignments innecesario justo al entrar.

4. Afinar sincronización realtime/admin
   - Consolidar la protección `recentMatchRef` / `recentMutationsRef` para que no haya sobrescrituras ni recomputaciones dobles.
   - Evitar que snapshots o realtime fuercen renders extra en los primeros segundos tras el match.

5. Revisar side effects secundarios
   - Confirmar que `appendTripHistoryEntry`, WhatsApp y email sigan totalmente no bloqueantes.
   - Si hace falta, mover historial y notificaciones a backend/trigger/edge function para desacoplarlos más del cliente.

Resultado esperado:
- Caso normal: 1–3s end-to-end.
- Caso con red mala: sigue habiendo recuperación, pero solo entonces se paga el coste de timeout/polling.
- Mejor trazabilidad para distinguir “RPC lento”, “respuesta perdida” y “UI lenta después del éxito”.

Detalles técnicos:
```text
Flujo ideal deseado:
click
  -> RPC assign_package_to_travelers
  -> update local package status
  -> cerrar modal / feedback inmediato
  -> side effects asíncronos
  -> refrescos no críticos en background

Flujo actual sospechoso:
click
  -> RPC con retry/timeout
  -> si falla o parece fallar: polling DB
  -> dashboard vuelve a verificar
  -> cambio de tab a matches
  -> fetchAssignments + realtime/snapshots
```

Archivos a tocar:
- `src/hooks/useDashboardActions.tsx`
- `src/components/AdminDashboard.tsx`
- `src/components/admin/AdminMatchDialog.tsx`
- `src/components/admin/AdminMatchingTab.tsx`

Enfoque recomendado:
- Primero medir exactamente dónde se van esos minutos.
- Después recortar solo el tramo culpable, no a ciegas.
- Así preservamos la resiliencia sin aceptar esperas absurdas en el flujo normal.
