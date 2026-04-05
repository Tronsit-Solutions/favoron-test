

## Plan revisado: Optimizar tiempos sin eliminar protecciones

### Problema real

Las protecciones son necesarias, pero los tiempos son excesivos:
- Retry delay: 2000ms → debería ser 500ms
- RPC timeout: 12000ms → debería ser 8000ms  
- Polling: 12000ms con intervalos de 1200ms → 6000ms con intervalos de 800ms
- Branch genérico: polling 4000ms → 3000ms

### Cambios

**Archivo: `src/hooks/useDashboardActions.tsx`**

1. Reducir `baseDelay` de `withRetry` de 2000 a 500 (línea ~1339)
2. Reducir `rpcTimeoutMs` de 12000 a 8000 (línea ~1319)
3. Reducir `waitForMatchConfirmation` default timeout de 12000 a 6000 e intervalo de 1200 a 800 (línea ~1310)
4. Reducir timeout del branch `NO_NEW_TRIPS` de 5000 a 3000 (línea ~1363)
5. Reducir timeout del branch genérico de 4000 a 3000 (línea ~1376)

**Archivo: `src/hooks/useConsolidatedRealtimeAdmin.tsx`**

6. Agregar `recentMutationsRef` para ignorar eventos Realtime de paquetes mutados en los últimos 2s (evita overwrites post-match)

**Archivo: `src/components/AdminDashboard.tsx`**

7. Crear y pasar `recentMutationsRef`, registrar packageId al iniciar match

### Resultado

- Peor caso: de ~26s a ~14s
- Caso normal (red estable): ~100-300ms (sin cambios, el RPC responde rápido)
- Caso red lenta: retry a 500ms en vez de 2s
- Sin riesgo de UI colgado o matches fantasma

