

## Agregar labels correctos a la dirección de recepción en PackageDetailModal

### Cambio
En `src/components/admin/PackageDetailModal.tsx`, líneas 1311-1322, la dirección se muestra sin labels descriptivos. Agregar los títulos correctos: "Dirección 1", "Dirección 2", "Ciudad", "Estado" (o separar cityArea), "Código postal".

### Implementación — líneas 1311-1322

Reemplazar el bloque actual:
```tsx
// Antes: se muestran los valores sin labels
<p>{streetAddress}</p>
<p>{streetAddress2}</p>
<p>{cityArea}, {postalCode}</p>

// Después: con labels descriptivos
<p><strong>Dirección 1:</strong> {streetAddress}</p>
<p><strong>Dirección 2:</strong> {streetAddress2}</p>
<p><strong>Ciudad/Estado:</strong> {cityArea}</p>
<p><strong>Código postal:</strong> {postalCode}</p>
```

### Archivos
- **Modificar**: `src/components/admin/PackageDetailModal.tsx` — líneas 1311-1322

