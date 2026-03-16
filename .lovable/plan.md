

## Bug: Step 1 del formulario se renderiza dos veces

### Causa
En `src/components/PackageRequestForm.tsx`, líneas 1622-1623, hay dos llamadas idénticas a `renderStep1()`:

```typescript
{currentStep === 1 && renderStep1()}
{currentStep === 1 && renderStep1()}  // ← duplicada
```

### Fix
Eliminar la línea 1623 (la llamada duplicada).

### Archivo
- `src/components/PackageRequestForm.tsx` — eliminar línea 1623

