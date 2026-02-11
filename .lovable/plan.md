

## Simplificar flujo de reembolsos: eliminar estado "Aprobado"

### Cambio conceptual

Actualmente el flujo es: **Pendiente -> Aprobado -> Completado** (o Rechazado). El paso "Aprobado" no aporta valor porque en la practica el admin aprueba y luego tiene que volver a entrar para "completar". Se simplifica a:

**Pendiente -> Completado** (con comprobante opcional) o **Pendiente -> Rechazado**

### Archivos a modificar

**1. `src/components/admin/AdminRefundsTab.tsx`**
- Eliminar la tab "Aprobados" y su filtro (`approvedRefunds`)
- Eliminar la card de stats de "Aprobados"
- Cambiar la grid de stats de 4 columnas a 3
- En la tabla de "Pendientes", reemplazar los botones de Aprobar (check verde) y Rechazar (X roja) por:
  - Boton "Completar" (check verde) que abre modal para subir comprobante + notas
  - Boton "Rechazar" (X roja) que abre modal para notas
- Eliminar el tipo `'approve'` del `actionModal` y la funcion `handleApprove`
- Eliminar la seccion del modal que muestra input de comprobante para `approve`
- Eliminar estado `approveFile`
- En el modal de "Completar", combinar la logica: el admin puede agregar notas y subir comprobante en un solo paso
- Eliminar la logica que mostraba boton de Upload en la tab "Aprobados" (lineas 219-228)

**2. `src/hooks/useRefundOrders.tsx`**
- En `updateRefundStatus`, eliminar `'approved'` del tipo union de `status` (linea 242)
- En la validacion de duplicados de `createRefundOrder`, cambiar `['pending', 'approved']` a solo `['pending']` (linea 79) ya que "approved" ya no existira como estado intermedio
- En el tipo `RefundOrder`, eliminar `'approved'` del union de status (linea 16)

**3. `src/components/admin/FinancialSummaryTable.tsx`**
- Cambiar el query de refund orders de `.in('status', ['approved', 'completed'])` a `.eq('status', 'completed')` (linea 122)
- Solo los reembolsos completados (con transferencia hecha) aparecen como contrapartida negativa

**4. `src/components/admin/AdminPaymentsUnifiedTab.tsx`**
- Sin cambios necesarios, ya usa el conteo de `pending` para el badge

### Datos legacy

La orden de reembolso con status `approved` que aparece en la screenshot (Makeup Amarillo, Q22.50) se debe migrar a `completed` con un UPDATE en la base de datos, ya que fue aprobada y tiene comprobante.

### Flujo resultante

```text
Orden de reembolso creada (pending)
   |
   |-- Admin la completa (sube comprobante + notas) --> status = 'completed'
   |-- Admin la rechaza (agrega notas) --> status = 'rejected'
```

