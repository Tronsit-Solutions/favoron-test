

## Plan: Diagnosticar y corregir paquetes no visibles bajo viajes

### Problema identificado

El paquete "crox" (id: `6f0bd6ae`, status: `completed`) asignado al viaje `0da7b8c8` **sí se carga correctamente** (aparece en el modal de Tips), pero no se muestra como tarjeta anidada bajo el viaje en la pestaña "Viajes".

El filtro `tripPackages` en Dashboard.tsx (líneas 751-767) DEBERÍA incluirlo ya que `completed` está en `PAID_OR_POST_PAYMENT`. Sin embargo, hay un posible bug sutil:

### Causa probable: Race condition del cache

Cuando un admin navega al tab "Viajes", los datos de paquetes cambian de `adminData.packages` a `regularPackagesData.packages`. El hook `useCachedData` tiene un `minRefetchInterval` de 60 segundos que podría estar impidiendo la carga. Además, `fetchFn` no está en las dependencias del `useEffect`, lo que podría causar que se use una función stale.

### Corrección propuesta

1. **Agregar debug logging temporal** al filtro `tripPackages` para confirmar exactamente qué se filtra y por qué

2. **Asegurar que `fetchFn` se use correctamente** en `useCachedData` — agregar `fetchFn` como ref para evitar closures stale:

```typescript
// En useCachedData.tsx - usar ref para fetchFn
const fetchFnRef = useRef(fetchFn);
fetchFnRef.current = fetchFn;

// En fetchData, usar fetchFnRef.current en lugar de fetchFn
const result = await fetchFnRef.current();
```

3. **Verificar el `minRefetchInterval` por key** — actualmente `lastFetchRef` es compartido entre keys, lo que podría bloquear fetches legítimos cuando cambia el key:

```typescript
// Cambiar lastFetchRef de un single number a un map por key
const lastFetchRef = useRef<Map<string, number>>(new Map());
```

### Archivos a modificar
- `src/hooks/useCachedData.tsx` — corregir race condition con fetchFn ref y lastFetch por key
- `src/components/Dashboard.tsx` — agregar logging temporal para debug (se puede remover después)

