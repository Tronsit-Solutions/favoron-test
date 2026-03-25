

## Agendar llamadas en Customer Experience

### Situación actual
La tabla `customer_experience_calls` tiene un campo `call_date` que actualmente se usa como fecha de llamada realizada. No existe un campo para agendar llamadas futuras ni un estado "scheduled".

### Plan

**1. Migración: agregar columna `scheduled_date`**
- Agregar `scheduled_date timestamptz` a `customer_experience_calls`
- Agregar nuevo valor de estado `scheduled` al flujo

**2. Actualizar el hook `useCustomerExperience.ts`**
- Agregar `scheduled_date` al interface `CXPackageRow`
- Incluir `scheduled_date` en el fetch de CX calls y en `saveCXCall`
- Agregar stat de "Agendados" al conteo

**3. Actualizar `CustomerExperienceTable.tsx`**
- Agregar columna "Agendar" con un date picker para seleccionar fecha/hora de llamada agendada
- Agregar estado `scheduled` (color naranja) al `statusConfig`
- Mostrar indicador visual cuando una llamada está agendada para hoy

**4. Actualizar filtros en `AdminCustomerExperience.tsx`**
- Agregar opción "Agendado" al select de filtro de estado
- Agregar stat card de "Agendados" (reemplazar o agregar junto a los existentes)

**5. Ordenamiento por prioridad**
- Las llamadas agendadas para hoy aparecen primero en la tabla
- Luego las agendadas para fechas futuras, luego pendientes

### Archivos a modificar
- Nueva migración SQL (agregar `scheduled_date`)
- `src/hooks/useCustomerExperience.ts`
- `src/components/admin/cx/CustomerExperienceTable.tsx`
- `src/pages/AdminCustomerExperience.tsx`

