

## Cambiar cálculo de "Promedio de Días" en Paquetes Completados

### Contexto actual
El cálculo actual usa `created_at` → `updated_at`, lo cual no refleja el ciclo operativo real.

### Nuevo cálculo
- **Inicio**: Fecha en que el pago fue procesado (status → `pending_purchase`)
  - Campo: `payment_receipt.paid_at` (pagos con tarjeta) o `payment_receipt.uploadedAt` (transferencias bancarias)
- **Fin**: Fecha en que se confirmó en oficina
  - Campo: `office_delivery.admin_confirmation.confirmed_at`

Si alguno de estos campos no existe en un paquete, se excluye del cálculo de promedio (fallback a `null`).

### Archivo a modificar
**`src/components/admin/CompletedPackagesTable.tsx`**

1. Extraer la fecha de pago de `payment_receipt` (usando `paid_at` o `uploadedAt` como fallback)
2. Extraer la fecha de confirmación de `office_delivery.admin_confirmation.confirmed_at`
3. Calcular `daysElapsed` como la diferencia entre ambas fechas
4. Solo incluir paquetes con ambas fechas en el cálculo del promedio
5. Mostrar el nuevo valor en la columna "Días" y en la tarjeta "Promedio de Días"

### Detalle técnico
```text
paymentDate = payment_receipt.paid_at || payment_receipt.uploadedAt
officeDate  = office_delivery.admin_confirmation.confirmed_at
daysElapsed = ceil((officeDate - paymentDate) / 86400000)
```

Paquetes sin alguna de las dos fechas mostrarán "N/A" en la columna Días y no contarán para el promedio.

