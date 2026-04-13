

## Plan: Notas CX específicas para paquetes cancelados

### Problema
Las notas en la pestaña de cancelados se guardan en `packages.internal_notes`, que es un campo genérico. Las notas de CX deberían ser independientes y específicas del seguimiento de Customer Experience.

### Opción A: Reutilizar `customer_experience_calls` (recomendado)
La tabla ya existe con campos `notes`, `call_status`, `rating`, etc. Se puede reutilizar para cancelados agregando registros con un `user_type` como `"cancelled"` o similar. No requiere migración de esquema.

**Cambios:**
1. **`src/hooks/useCancelledPackages.ts`**: 
   - Fetch CX calls para los paquetes cancelados (filtrando por `user_type = 'cancelled'`)
   - Cambiar `updateNotes` para hacer upsert en `customer_experience_calls` en vez de `packages.internal_notes`
   - Agregar `cx_notes` al `CancelledPackageRow` interface

2. **`src/components/admin/cx/CancelledPackagesTable.tsx`**: 
   - Actualizar `NotesCell` para usar `cx_notes` en vez de `internal_notes`

### Opción B: Crear tabla nueva `cx_cancelled_notes`
Tabla dedicada solo para notas de cancelados. Más limpio conceptualmente pero agrega complejidad innecesaria cuando `customer_experience_calls` ya tiene la estructura perfecta.

### Recomendación
**Opción A** — reutilizar `customer_experience_calls`. Ya tiene RLS configurado, campo `notes`, y la lógica de upsert ya existe en el hook de CX de completados. Solo hay que replicar el patrón para cancelados.

### Resultado
- Las notas de CX para cancelados se guardan separadas de `packages.internal_notes`
- Se mantiene un registro centralizado de todas las interacciones CX en una sola tabla
- No requiere migración de base de datos
