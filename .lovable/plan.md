

## Agregar campo de comentarios para ordenes de pago

### Contexto
La tabla `payment_orders` ya tiene un campo `notes` y se puede agregar una nota al completar/rechazar un pago. Sin embargo, no hay forma de ver ni editar notas desde la tabla principal ni desde el modal de detalles (el de "Ver") una vez creada la orden.

### Cambios

**1. Tabla de ordenes - mostrar notas existentes en la fila expandida**
- En `AdminTravelerPaymentsTab.tsx`, dentro del componente `CompactOrderRow`, agregar una seccion en el area expandida que muestre las notas actuales si existen.
- Agregar un campo de texto editable (Textarea) con un boton "Guardar" para que el admin pueda agregar o editar notas directamente desde la fila expandida, sin necesidad de abrir un modal.

**2. Modal de detalle ("Ver") - hacer las notas editables**
- En el `OrderDetailModal` dentro del mismo archivo, cambiar la seccion de notas de solo lectura a editable.
- Agregar un Textarea con un boton para guardar cambios en las notas.
- Mostrar la seccion de notas siempre (no solo cuando ya existen notas).

**3. Logica de guardado**
- Usar la funcion `updatePaymentOrder` que ya existe en el hook `usePaymentOrders` para actualizar el campo `notes`.
- Mostrar un toast de confirmacion al guardar.

### Archivos a modificar
- `src/components/admin/AdminTravelerPaymentsTab.tsx`: Agregar notas editables en la fila expandida y en el modal de detalle.

### Detalles tecnicos

En `CompactOrderRow` (fila expandida), despues de la seccion de "Bank Details", agregar:
```text
- Textarea con el valor actual de order.notes
- Boton "Guardar nota" que llame updatePaymentOrder(order.id, { notes: newNotes })
- Indicador visual si ya hay notas (icono de mensaje en la fila colapsada)
```

En `OrderDetailModal`, reemplazar el bloque de notas de solo lectura por un Textarea editable con boton de guardar.

No se requieren cambios en la base de datos ya que el campo `notes` ya existe en la tabla `payment_orders`.

