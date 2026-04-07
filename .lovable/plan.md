
Problema confirmado: el sistema sí sigue pudiendo tardar “minutos” por diseño actual, aunque el toast diga que va “en segundo plano”.

Qué encontré
- En `src/components/AdminDashboard.tsx`, al confirmar el match se cierra el modal y se muestra el toast: `"Asignando paquete..." / "Procesando match en segundo plano."`
- Pero ese flujo hace `await onMatchPackage(...)`. O sea: visualmente parece background, pero en realidad el cliente sigue esperando el RPC.
- En `src/hooks/useDashboardActions.tsx`, `handleMatchPackage` puede durar muchísimo porque hoy hace:
  - hasta 3 intentos totales (`MAX_RETRIES = 2`)
  - cada intento puede esperar hasta 25s por `AbortController`
  - entre reintentos agrega 1s + 1s
- Peor caso actual aproximado:
  - `25s + 1s + 25s + 1s + 25s = 77s`
  - si además hay latencia del navegador / red / Supabase, la percepción se acerca a “minutos”
- Las notificaciones no son el cuello de botella principal:
  - después del RPC exitoso se disparan dentro de `setTimeout(0)`
  - WhatsApp y email están fuera del camino crítico del match exitoso
- El texto del toast es engañoso:
  - dice “en segundo plano”
  - pero el proceso crítico sigue siendo bloqueante desde el lado del cliente

Causa más probable
- El problema no parece ser “crear filas + cambiar status” como lógica de negocio, sino que el RPC `assign_package_to_travelers` está tardando o quedándose colgado hasta timeout.
- Y como encima hay reintentos largos, un solo match fallido se convierte en una espera enorme.

Plan de solución
1. Corregir la UX del toast
- Cambiar el mensaje para que no diga “en segundo plano” mientras realmente se está esperando.
- Mostrar algo como:
  - “Confirmando match...”
  - “Esto puede tardar unos segundos”
- Así evitamos una expectativa falsa.

2. Reducir drásticamente el tiempo máximo de espera
- Bajar el timeout por intento de 25s a un rango más agresivo (por ejemplo 8–12s).
- Reducir reintentos a 1 intento extra o incluso 0 mientras diagnosticamos.
- Objetivo: que un fallo responda rápido en vez de congelar al admin por más de 1 minuto.

3. Instrumentar mejor la latencia real
- Mantener logs por intento y total.
- Agregar también logging explícito del inicio y fin del flujo en `AdminDashboard.tsx`, para diferenciar:
  - tiempo hasta cerrar modal
  - tiempo total hasta éxito/error
- Esto confirmará si el cuello está en el RPC o en la capa fetch/red.

4. Implementar un flujo verdaderamente desacoplado si el RPC puede ser largo
- Si queremos un “background” real, no basta con cerrar el modal.
- Hay dos caminos:
  - Camino corto: dejar de llamarlo “background” y solo acotar tiempos.
  - Camino robusto: rediseñar a “iniciar operación + consultar estado/polling”.
- Para ese rediseño haría falta una fuente de estado confiable del match, por ejemplo:
  - polling del paquete/assignments
  - o una función/tabla de estado del job
- Ese es el enfoque correcto si Supabase/PostgREST sigue cortando operaciones largas.

5. Revisar el RPC para quitar trabajo innecesario dentro de la transacción
- Aunque la función es simple, revisar y optimizar:
  - filtro de asignaciones activas
  - inserciones por loop
  - update final de `packages`
- Posible mejora:
  - cambiar el `FOR ... LOOP` por un `INSERT ... SELECT` en bloque
- También revisar si hay triggers sobre `packages` o `package_assignments` que sigan corriendo en esta transición.

Archivos a tocar
- `src/components/AdminDashboard.tsx`
  - corregir el texto del loading toast
  - opcionalmente mostrar estado más preciso
- `src/hooks/useDashboardActions.tsx`
  - bajar timeout por intento
  - bajar cantidad de reintentos
  - mejorar logs de duración
- `supabase/migrations/...`
  - solo si decidimos optimizar el RPC SQL o cambiar a un modelo de polling/background real

Detalles técnicos
```text
Flujo actual real:
UI cierra modal
→ muestra toast "en segundo plano"
→ await handleMatchPackage()
→ hasta 3 intentos
→ cada intento puede esperar 25s
→ total ~77s antes de fallar
```

```text
Dirección recomendada inmediata:
- timeout por intento: 8s–12s
- retries: 0 o 1
- toast honesto: "Confirmando match..."
```

```text
Dirección recomendada estructural:
- iniciar match rápido
- no esperar RPC largo en el cliente
- consultar estado por polling / realtime
- actualizar UI cuando package_assignments y package status confirmen el resultado
```
