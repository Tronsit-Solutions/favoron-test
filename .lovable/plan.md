

## Fix: Match tarda 3+ minutos

### Causa raíz

El problema principal es que `fetchPackages()` en `usePackagesData.tsx` es una query pesada (SELECT * con 3 niveles de JOINs anidados: packages → profiles, packages → trips → trip.profiles) que se ejecuta SIN ningún control:

1. **Sin debounce en realtime**: Cada vez que CUALQUIER paquete cambia en la DB, la suscripción realtime (línea 191) ejecuta `fetchPackages()` inmediatamente — sin debounce, sin deduplicación
2. **Múltiples triggers durante un match**: Un match genera al menos 2 cambios en la tabla packages (insert assignments no genera trigger, pero el `updatePackage` en línea 1379 sí), más el `refreshAdminData` a los 2 segundos (línea 271)
3. **Query sin filtro**: `fetchPackages()` carga TODOS los paquetes de la DB con joins anidados. Si hay cientos de paquetes, esta query puede tardar varios segundos cada vez
4. **`updatePackage` hace `.select()` redundante**: En línea 113-118, después de hacer update hace `.select().maybeSingle()` para obtener los datos actualizados — pero luego el realtime subscription vuelve a hacer un fetch completo de TODOS los paquetes

### Solución

#### 1) `src/hooks/usePackagesData.tsx` — Debounce en la suscripción realtime

Agregar un debounce de 1 segundo al handler de realtime para evitar múltiples refetches seguidos:

```tsx
// Usar useRef para el timeout
const debounceRef = useRef<NodeJS.Timeout>();

// En la suscripción:
(payload) => {
  clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => fetchPackages(), 1000);
}
```

#### 2) `src/hooks/usePackagesData.tsx` — Deduplicar fetches concurrentes

Agregar un guard para evitar que se ejecuten múltiples `fetchPackages()` simultáneos:

```tsx
const fetchInProgressRef = useRef(false);

const fetchPackages = async () => {
  if (fetchInProgressRef.current) return;
  fetchInProgressRef.current = true;
  try { ... } finally { fetchInProgressRef.current = false; }
};
```

#### 3) `src/components/AdminDashboard.tsx` — Eliminar refresh redundante

Eliminar el `setTimeout(() => refreshAdminData(), 2000)` en línea 271 — ya no es necesario porque el realtime subscription se encarga del refresh, y la actualización optimista ya mueve el paquete en la UI inmediatamente.

### Archivos
- **Modificar**: `src/hooks/usePackagesData.tsx` — debounce + deduplicación
- **Modificar**: `src/components/AdminDashboard.tsx` — eliminar refresh redundante

### Resultado esperado
- Match se completa en 1-3 segundos en vez de 3+ minutos
- Un solo refetch después del match en vez de múltiples cascadas

