

## Fix: Orden de pago del viaje a083cd4b

### Estado actual de los paquetes

| Paquete | Estado | Tip | Incidente | En pago? |
|---------|--------|-----|-----------|----------|
| Banda Whoop 5.0 | completed | Q140 | No | Sí |
| Control + Ruedas | completed | Q75 | No | Sí |
| Hub USB C | ready_for_pickup | Q25 | No | Sí |
| Fragrances (3 prod) | completed | Q108 | **Sí** | **No** |
| Vinyl | archived_by_shopper | Q45 | No | No (archivado) |
| Reloj whoop | cancelled | Q120 | No | No (cancelado) |

### Problema
El paquete de fragancias (1bbf137e) tiene `incident_flag: true` aunque su status es `completed`. Esto hace que el sistema lo excluya del cálculo de pago al viajero. El acumulador actual suma Q240 (140+75+25) pero debería ser **Q348** (240+108).

### Correcciones necesarias

**1. Quitar incident_flag del paquete de fragancias**
```sql
UPDATE packages SET incident_flag = false 
WHERE id = '1bbf137e-e393-455d-872a-2e3495942e9b';
```

**2. Recalcular el acumulador del viaje**
```sql
UPDATE trip_payment_accumulator 
SET accumulated_amount = 348,
    delivered_packages_count = 4,
    total_packages_count = 4,
    updated_at = now()
WHERE trip_id = 'a083cd4b-ecd5-4d35-af6e-58be4852c975';
```

**3. Actualizar el monto de la orden de pago pendiente**
```sql
UPDATE payment_orders 
SET amount = 348
WHERE trip_id = 'a083cd4b-ecd5-4d35-af6e-58be4852c975' 
AND status = 'pending';
```

**4. Actualizar el snapshot histórico de la orden de pago** para incluir el paquete de fragancias en el desglose (esto se haría regenerando el snapshot via la Edge Function `recalculate-trip-accumulator` o manualmente en el JSON).

### Resumen
- Monto actual: **Q240** (3 paquetes)
- Monto correcto: **Q348** (4 paquetes, incluyendo fragancias Q108)
- Paquetes excluidos correctamente: Vinyl (archivado), Reloj (cancelado)

