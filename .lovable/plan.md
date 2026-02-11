

## Fix: Tabla financiera con query propia de paquetes pagados

### Problema

La tabla financiera depende de los paquetes paginados del admin (50 por pagina). Los paquetes viejos como el de Valeria Villeda (22 enero) nunca se cargan.

### Solucion

Agregar una query independiente en `FinancialSummaryTable.tsx` que solo traiga paquetes **pagados** del mes seleccionado. Esto es eficiente porque:
- Filtra por mes (tipicamente 20-50 paquetes pagados por mes)
- Solo trae estados que implican pago realizado
- No trae paquetes pendientes, en cotizacion, etc.

### Cambios en `src/components/admin/FinancialSummaryTable.tsx`

1. Agregar un `useQuery` independiente que consulte directamente a Supabase:

```text
Query: packages donde:
  - created_at dentro del mes seleccionado
  - status IN ('pending_purchase', 'purchase_confirmed', 'shipped', 
    'in_transit', 'received_by_traveler', 'pending_office_confirmation',
    'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 
    'out_for_delivery', 'completed')
  
  O (para cancelados pagados):
  - status IN ('cancelled', 'archived_by_shopper') 
    Y tiene evidencia de pago (filtro client-side)
```

2. Los campos a traer son solo los que usa el componente: `id, user_id, status, item_description, matched_trip_id, created_at, quote, payment_receipt, products_data, payment_method, recurrente_checkout_id, recurrente_payment_id, delivery_method, admin_assigned_tip, estimated_price, incident_flag`

3. Usar los datos de esta query en lugar del prop `packages` para los calculos y la tabla

4. La query se re-ejecuta cuando cambia el mes seleccionado

### Volumen esperado por query

- Paquetes pagados activos por mes: ~20-40
- Paquetes cancelados con pago por mes: ~2-5
- Total: ~25-45 registros por mes (muy eficiente)

### Impacto

- Solo se modifica `FinancialSummaryTable.tsx`
- No cambia la interfaz del componente (sigue recibiendo `packages` prop por compatibilidad)
- La tabla mostrara TODOS los paquetes pagados del mes, sin importar la paginacion del admin
