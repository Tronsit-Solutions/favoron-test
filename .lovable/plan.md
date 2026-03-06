

## Cambios en etiqueta: eliminar viajero + reducir espaciado

### Archivos a modificar

**`src/components/admin/PackageLabel.tsx`**:

1. **Eliminar sección VIAJERO**: Remover el bloque condicional `{trip && (...)}` que muestra "VIAJERO: nombre" (líneas ~153-160). También se puede eliminar la función `getTravelerName()` ya que no se usará.

2. **Reducir espaciado entre líneas**: Cambiar `space-y-3` a `space-y-1` en el contenedor de contenido, y reducir el padding de `p-4` a `p-2` (modo normal) para que la etiqueta sea más compacta. Ajustar `space-y-1` en los sub-bloques también.

Estos cambios aplican tanto a la vista previa en pantalla como al PDF generado (ya que ambos renderizan el mismo componente `PackageLabel` vía html2canvas).

