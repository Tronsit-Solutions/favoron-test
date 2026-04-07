

## Diagnóstico completo: Por qué los matches tardan tanto

### Lo que descubrí

1. **El AbortController NO funciona**: `supabase.rpc('...', params, { signal })` — el SDK de Supabase JS v2 **no soporta `signal` en `.rpc()`**. El timeout de 10s que implementamos nunca se aplica. El fetch real puede colgar hasta el timeout del navegador (~60-120s) o el statement_timeout de Postgres (configurado en **2 minutos**).

2. **Los triggers son inocuos**: De los 14 triggers que se ejecutan, ninguno hace trabajo bloqueante para la transición `approved → matched`. Todos son no-ops para ese cambio de estado.

3. **El RPC es simple y rápido**: Solo filtra duplicados, inserta 1-2 filas en `package_assignments`, y actualiza `packages.status`. Con 266 asignaciones totales e índices correctos, debería ejecutar en <100ms.

4. **No hay errores registrados**: La tabla `client_errors` no tiene ningún registro de tipo `match_error`, lo que confirma que el código de logging post-fallo no se alcanza — el fetch se queda colgado sin resolver.

### Causa raíz probable

El problema está en la **capa de red/PostgREST**, no en Postgres. Las posibilidades son:
- PostgREST connection pool saturado o cold start lento
- El navegador mantiene el fetch abierto sin respuesta
- Sin AbortController funcional, no hay manera de cortar la espera

### Plan de solución

**1. Reemplazar `supabase.rpc()` con `fetch()` directo al endpoint REST**
- Usar `fetch()` nativo con `AbortController` real que SÍ funciona
- Timeout de 12 segundos por intento
- Esto garantiza que el timeout se aplique correctamente

**2. Agregar logging pre-RPC para confirmar que la llamada sale**
- Log a `client_errors` ANTES de llamar al RPC (tipo `match_attempt`)
- Si el match falla y no hay `match_error` pero sí `match_attempt`, sabemos que el fetch se colgó

**3. Mantener 1 retry con 1s de delay**

### Archivos a modificar

**`src/hooks/useDashboardActions.tsx`**:
- Reemplazar `supabase.rpc(...)` con `fetch()` directo a `https://dfhoduirmqbarjnspbdh.supabase.co/rest/v1/rpc/assign_package_to_travelers`
- Usar headers de autenticación del cliente Supabase
- AbortController con timeout de 12s (real, funcional)
- Agregar log de `match_attempt` antes de la llamada

### Detalle técnico

```text
Antes (no funciona):
  supabase.rpc('assign_package_to_travelers', params, { signal }) 
  → signal ignorado → fetch cuelga hasta 2min

Después (funciona):
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 12000);
  fetch(RPC_URL, { signal: controller.signal, ... })
  → timeout real de 12s → fallo rápido si PostgREST no responde
```

```text
Peor caso nuevo:
  12s + 1s delay + 12s = 25s (vs ~120s+ actual)
```

```text
Nuevo logging:
  1. match_attempt → se registra ANTES del fetch
  2. match_error → se registra si falla
  3. Si hay attempt sin error → el fetch se colgó sin resolver
```

