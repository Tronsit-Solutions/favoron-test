
# Plan: Corregir Visibilidad de Paquetes Reasignados ✅

## Estado: COMPLETADO

### Parte 1: Corrección Inmediata (SQL Manual) - PENDIENTE

Ejecutar en [Supabase SQL Editor](https://supabase.com/dashboard/project/dfhoduirmqbarjnspbdh/sql/new):

```sql
UPDATE packages 
SET traveler_dismissed_at = NULL, traveler_dismissal = NULL
WHERE id IN (
  '5b9e06d6-2150-403d-a288-3ccfaef729ae',
  'cc8089c0-cbed-406e-893e-01b56746c615'
);
```

### Parte 2: Prevención Futura (Código) - ✅ COMPLETADO

Archivos modificados:
- `src/hooks/useDashboardActions.tsx`: Limpia `traveler_dismissed_at` y `traveler_dismissal` al asignar paquetes
- `src/components/AdminDashboard.tsx`: Actualización optimista también limpia los campos
