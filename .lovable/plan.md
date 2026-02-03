
## Mostrar Todos los Usuarios en la Tabla de Adquisición

### Problema
Los filtros actuales excluyen a usuarios que no han respondido la encuesta. El usuario quiere ver a **todos** los usuarios, con su respuesta (si la tienen) o "Sin respuesta" si no la han completado.

### Solución
Modificar el hook `useAcquisitionSurveyResponses` para:

1. **Quitar los filtros** de `acquisition_source` y `acquisition_source_answered_at`
2. **Ordenar por fecha de creación** como fallback cuando no hay fecha de respuesta

### Cambios

**Archivo:** `src/hooks/useAcquisitionSurveyResponses.tsx`

```typescript
// ANTES (con filtros restrictivos):
.not('acquisition_source', 'is', null)
.not('acquisition_source_answered_at', 'is', null)
.order('acquisition_source_answered_at', ...)

// DESPUÉS (sin filtros, todos los usuarios):
.order('created_at', { ascending: false })
```

### Resultado esperado
La tabla mostrará:
- Usuarios que respondieron → Badge con el canal (TikTok, Meta, Referidos, etc.)
- Usuarios que no respondieron → Badge "Sin respuesta" en gris
