
## Agregar columna de confirmacion de oficina al modal de desglose de pago

### Cambios en `src/components/admin/AdminTravelerPaymentsTab.tsx`

**1. Agregar `office_delivery` al query (linea ~118)**

Cambiar el select para incluir `office_delivery`:
```
.select('id, item_description, status, quote, admin_assigned_tip, products_data, office_delivery')
```

**2. Agregar columna visual de confirmacion por paquete (lineas ~640-700)**

Para cada paquete en el desglose, agregar un icono/checkbox visual al lado derecho que indique si la oficina confirmo la recepcion:

- Si el status es `completed`, `ready_for_pickup`, `ready_for_delivery` o `out_for_delivery`: mostrar un check verde (ya paso por oficina)
- Si el status es `delivered_to_office` y tiene `office_delivery.admin_confirmation`: check verde
- Si el status es `delivered_to_office` sin `admin_confirmation`: icono de reloj/pendiente

Se mostrara como un icono compacto (CheckCircle o Clock) al nivel del paquete (no por producto individual), entre la descripcion y el monto del tip. Esto aplica tanto para paquetes con multiples productos como para paquetes individuales.

### Resultado esperado

Cada fila de paquete en el modal tendra un indicador visual:
- Check verde = oficina confirmo recepcion
- Reloj naranja = pendiente de confirmacion
