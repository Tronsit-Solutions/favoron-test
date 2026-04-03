

## Ordenar Matches por Fecha de Creación (más recientes arriba)

### Problema
Actualmente el sort tiene múltiples niveles de prioridad (admin actions, timers, statuses) antes de usar `created_at` como tiebreaker final. El usuario quiere que el orden principal sea por fecha de creación descendente.

### Cambio en `src/components/admin/matching/ActiveMatchesTab.tsx`

Simplificar el `.sort()` (líneas 233-277) para que el orden principal sea `created_at` descendente, manteniendo solo la regla de broken matches al fondo:

```tsx
.sort((a, b) => {
  // Broken matches always go to the bottom
  const aIsBroken = BROKEN_STATUSES.includes(a.status);
  const bIsBroken = BROKEN_STATUSES.includes(b.status);
  
  if (aIsBroken && !bIsBroken) return 1;
  if (!aIsBroken && bIsBroken) return -1;
  
  // Otherwise, newest first
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
});
```

### Resultado
- Los matches más recientes aparecen arriba
- Los matches rotos/broken siguen al fondo
- Un solo archivo modificado

