

## Plan: Toast al confirmar match

### Cambio
En `src/components/admin/AdminMatchDialog.tsx`, dentro de `handleMatch`, agregar un `toast.info` justo después de `setIsSubmittingMatch(true)` para notificar al admin que el match se está procesando.

### Detalle técnico

**Archivo**: `src/components/admin/AdminMatchDialog.tsx` (~línea 865)

Agregar después de `setIsSubmittingMatch(true)`:
```typescript
toast.info("Procesando asignación...", { description: "Confirmando el match con el viajero seleccionado." });
```

Usar `toast` de `sonner` (importar si no está ya importado). Solo una línea de código.

