

## Agregar filtros tipo Excel en los headers de la Tabla Financiera

### Que se hara

Se agregaran filtros desplegables (dropdown) en cada header de columna de la tabla `FinancialSummaryTable`, similar a como funcionan los filtros de autocompletar en Excel. Al hacer clic en el icono de filtro en un header, aparecera un popover con las opciones unicas de esa columna para filtrar.

### Columnas con filtro

| Columna | Tipo de filtro |
|---------|---------------|
| Shopper | Busqueda por texto + lista de nombres unicos |
| Viajero | Busqueda por texto + lista de nombres unicos |
| Estado | Checkboxes con los estados disponibles |
| Metodo Pago | Checkboxes (Tarjeta, Transferencia, Reembolso) |

Las columnas numericas (Total, Tip, Ingreso, etc.) y Fecha no tendran filtro en header ya que el mes ya se filtra arriba.

### Comportamiento

- Cada header mostrara un icono de filtro (funnel) junto al nombre
- Al hacer clic, se abre un Popover con las opciones
- Los filtros de texto (Shopper/Viajero) tendran un campo de busqueda para filtrar la lista
- Los filtros de estado/metodo tendran checkboxes para seleccion multiple
- Los filtros se aplican en cascada (todos activos simultaneamente)
- Un indicador visual (icono coloreado) mostrara cuando un filtro esta activo
- Boton "Limpiar" dentro de cada popover para resetear ese filtro
- Los totales se recalcularan segun los filtros aplicados

### Detalle tecnico

**Archivo a modificar:** `src/components/admin/FinancialSummaryTable.tsx`

**Cambios:**

1. **Nuevo estado para filtros:**
   - `shopperFilter: string[]` - nombres seleccionados
   - `travelerFilter: string[]` - nombres seleccionados
   - `statusFilter: string[]` - estados seleccionados
   - `paymentMethodFilter: string[]` - metodos seleccionados

2. **Componente `ColumnFilter`** (inline o separado):
   - Usa `Popover` + `PopoverTrigger` + `PopoverContent`
   - Input de busqueda para filtrar opciones
   - Lista de checkboxes con las opciones unicas
   - Botones "Seleccionar todos" y "Limpiar"

3. **Logica de filtrado:**
   - Se aplica despues del filtro de mes existente y antes de la paginacion
   - Los totales se recalculan con los filtros aplicados

4. **Header modificado:**
   - Cada `TableHead` filtrable tendra el nombre + icono de filtro
   - El icono cambia de color cuando el filtro esta activo

