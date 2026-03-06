

## Hacer la grafica de Crecimiento de Ingresos consistente con la Tabla Resumen Financiera

### Problema raiz

La grafica usa la funcion RPC `get_monthly_package_stats` que tiene una **lista de estados diferente** a la Tabla Resumen Financiera, y agrupa por `created_at` en UTC mientras la tabla usa la zona horaria local del navegador. Ademas, la tabla incluye reembolsos completados en un mes dado (sin importar cuando se creo el paquete), pero la grafica solo considera reembolsos por `created_at` del paquete.

Diferencias en listas de estados:
- **RPC incluye** pero tabla no: `payment_pending_approval`, `paid`, `payment_confirmed`
- **Tabla incluye** pero RPC no: `purchase_confirmed`, `out_for_delivery`

### Solucion

Dejar de usar la RPC para el calculo de service fee de la grafica y en su lugar calcular el ingreso mensual con la misma logica que la tabla, directamente en `useDynamicReports`.

#### 1. Actualizar `get_monthly_package_stats` RPC (migracion SQL)

Alinear la lista de estados del CASE WHEN con la tabla:

```sql
CASE WHEN p.status IN (
  'pending_purchase','purchase_confirmed','shipped','in_transit',
  'received_by_traveler','pending_office_confirmation',
  'delivered_to_office','ready_for_pickup','ready_for_delivery',
  'out_for_delivery','completed'
) THEN ...
```

Esto hace que el service_fee bruto del RPC coincida con los paquetes activos que la tabla suma.

#### 2. Ajustar deduccion de contrapartidas en `useDynamicReports`

Actualmente las contrapartidas de cancelaciones se agrupan por `created_at` del paquete. La tabla las muestra por `updated_at` (cuando se cancelo). Cambiar el agrupamiento de contrapartidas a usar `updated_at` en lugar de `created_at`.

#### 3. Ajustar deduccion de reembolsos en `useDynamicReports`

Verificar que los reembolsos se agrupen por `completed_at` (o `created_at` del refund), igual que la tabla. Esto ya se hace correctamente.

#### 4. Encabezado de la grafica: mostrar valor del mes actual

Cambiar el numero grande arriba-derecha de la grafica para mostrar el valor del ultimo mes (barra mas reciente) en lugar de la suma acumulada de todo el periodo.

### Archivos a modificar

- **Nueva migracion SQL**: actualizar `get_monthly_package_stats` con estados alineados
- **`src/hooks/useDynamicReports.tsx`**: cambiar agrupamiento de contrapartidas de `created_at` a `updated_at`; no cambios en logica de refunds
- **`src/components/admin/charts/ServiceFeeGrowthChart.tsx`**: cambiar encabezado para mostrar solo el valor del ultimo mes

