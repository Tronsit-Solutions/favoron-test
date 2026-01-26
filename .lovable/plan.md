

# Plan: Corregir Mensajes Incorrectos sobre Quién Compra el Producto

## Problema Crítico

El mensaje "Pago confirmado - Viajero comprará el producto" es **completamente incorrecto**. En el flujo de Favoron:

| Rol | Responsabilidad |
|-----|-----------------|
| **Shopper** | Compra el producto en la tienda online y lo envía a la dirección del viajero |
| **Viajero** | Recibe el paquete en su dirección y lo transporta a Guatemala |

El texto actual confunde a los usuarios al sugerir que el viajero es quien compra.

## Ubicaciones del Error

### Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`

| Línea | Texto Actual (Incorrecto) | Texto Corregido |
|-------|---------------------------|-----------------|
| 153 | "Pago confirmado - Viajero comprará el producto" | "Pago confirmado - Procede a realizar tu compra" |
| 164 | "Paquete en tránsito a la dirección del viajero. El viajero confirmará al recibir el paquete" | "Tu paquete está en camino. El viajero confirmará cuando lo reciba" |

### Nota sobre "Ver dirección y comprar" (Línea 841)

Este texto del botón es **correcto** porque se muestra al shopper, indicándole que debe ver la dirección del viajero y realizar la compra. No requiere cambio.

## Cambios Propuestos

### Cambio 1: Estado `pending_purchase` (Línea 153)

```typescript
// ANTES (incorrecto):
case 'pending_purchase':
  return "Pago confirmado - Viajero comprará el producto";

// DESPUÉS (correcto):
case 'pending_purchase':
  return "Pago confirmado - Procede a realizar tu compra";
```

**Razón:** El shopper ya pagó a Favoron, ahora debe comprar el producto en la tienda y enviarlo a la dirección del viajero.

### Cambio 2: Estado `in_transit` (Línea 164)

```typescript
// ANTES:
return 'Paquete en tránsito a la dirección del viajero. El viajero confirmará al recibir el paquete';

// DESPUÉS:
return 'Tu paquete está en camino. El viajero confirmará cuando lo reciba';
```

**Razón:** Simplificar el mensaje manteniendo claridad sin mencionar quién compra.

## Resumen de Archivos a Modificar

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/components/dashboard/CollapsiblePackageCard.tsx` | 153, 164 | Corregir mensajes de estado para reflejar que el shopper compra |

## Impacto

- **UI/UX:** El shopper verá mensajes claros que le indican que debe realizar la compra
- **Riesgo:** Muy bajo, solo cambios de texto informativo

