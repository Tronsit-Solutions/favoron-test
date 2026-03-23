

## Reducir ancho de columna "Usuario"

### Cambio
En `src/components/admin/cx/CustomerExperienceTable.tsx`, línea 93, reducir el `min-w` de la columna "Usuario" de `150px` a `120px` y agregar `max-w-[150px]` con `truncate` en la celda para que nombres largos no expandan la columna.

### Archivos
- **Modificar**: `src/components/admin/cx/CustomerExperienceTable.tsx` — línea 93 (header) y línea 117-126 (cell)

