

## Agregar edición de Fecha Límite en el modal de detalles del paquete

### Cambio

**Archivo: `src/components/admin/PackageDetailModal.tsx`**

1. **Agregar estado para edición inline de fecha límite** (~línea 231):
   - `const [editDeadline, setEditDeadline] = useState(false);`
   - `const [editDeadlineValue, setEditDeadlineValue] = useState<Date | null>(null);`

2. **Reemplazar la sección estática de "Fecha Límite"** (líneas 2332-2337):
   - Mostrar la fecha actual con un botón de edición (ícono lápiz) al lado, similar al patrón de "Notas Adicionales".
   - Al hacer clic, mostrar un `Popover` con un `Calendar` para seleccionar nueva fecha.
   - Al confirmar, llamar `onUpdatePackage(pkg.id, { delivery_deadline: newDate.toISOString() })` y cerrar el editor inline.

3. **Guardar cambio**: Llamar `onUpdatePackage` directamente (sin depender del modo edición global), igual que el patrón de edición inline de notas.

### Diseño visual

La fecha límite pasará de texto estático a texto + botón lápiz. Al hacer clic se abre un calendario popover para seleccionar la nueva fecha. Se reutilizan los componentes `Calendar`, `Popover`, y `Button` ya importados en el proyecto.

