

## Corrección del cálculo de reembolso para incluir delivery fee cuando corresponde

### Problema identificado

El sistema actualmente **nunca reembolsa el delivery fee**, pero la lógica correcta es:

| Escenario | Delivery Fee |
|-----------|--------------|
| Cancelación de **paquete completo** (todos los productos) | **SÍ se reembolsa** |
| Cancelación **parcial** (queda al menos 1 producto activo) | **NO se reembolsa** |

### Ejemplo del problema

Pedido de 1 producto con:
- Tip: Q140
- Fee Favoron (50%): Q70  
- Delivery: Q25
- **Total pagado: Q235**

**Reembolso actual (incorrecto):** Q140 + Q70 - Q5 = Q205
**Reembolso correcto:** Q140 + Q70 + Q25 - Q5 = **Q230**

### Archivos a modificar

#### 1. `src/lib/refundCalculations.ts`

**Función `calculatePackageRefund`** (líneas 209-229):
- Cambiar para incluir el delivery fee en el reembolso
- El gross refund debe ser: tips + serviceFee + deliveryFee

```typescript
// ANTES (línea 220-221):
// Gross refund = all tips + service fee (delivery fee NOT refunded)
const grossRefund = totalTips + serviceFee;

// DESPUÉS:
// Gross refund = all tips + service fee + delivery fee (refund everything when cancelling full package)
const grossRefund = totalTips + serviceFee + deliveryFee;
```

**Función `getPackageRefundBreakdown`** (líneas 234-266):
- Incluir delivery fee en el cálculo del grossRefund
- Modificar línea 253:

```typescript
// ANTES:
const grossRefund = Math.round((totalTips + serviceFee) * 100) / 100;

// DESPUÉS:
const grossRefund = Math.round((totalTips + serviceFee + deliveryFee) * 100) / 100;
```

#### 2. `src/components/dashboard/PackageCancellationModal.tsx`

**Actualizar UI del desglose** (líneas 294-297):
- Cambiar "Delivery (no reembolsable)" a "Delivery" y mostrarlo sin tachado
- Ahora el delivery fee SÍ se suma al total

```tsx
// ANTES (líneas 294-297):
<div className="flex justify-between text-muted-foreground">
  <span>Delivery (no reembolsable)</span>
  <span className="line-through">Q{refundBreakdown.deliveryFee.toFixed(2)}</span>
</div>

// DESPUÉS:
<div className="flex justify-between">
  <span className="text-muted-foreground">Delivery</span>
  <span>Q{refundBreakdown.deliveryFee.toFixed(2)}</span>
</div>
```

#### 3. `src/components/admin/AdminRefundsTab.tsx`

**Agregar delivery fee al desglose de productos cancelados** (alrededor de línea 385-420):
- Necesitamos verificar si el refund incluye delivery fee (cuando es cancelación de paquete completo)
- Agregar campo `deliveryFee` a la visualización cuando aplique

```tsx
// Después de la línea de serviceFee, agregar:
{p.deliveryFee && p.deliveryFee > 0 && (
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">Delivery:</span>
    <span className="text-foreground">+{formatCurrency(p.deliveryFee)}</span>
  </div>
)}
```

### Nota sobre cancelación parcial (1 producto de varios)

Para la cancelación de **productos individuales** (no paquete completo), el cálculo actual es correcto:
- El delivery fee NO se reembolsa porque todavía hay productos activos que necesitan entrega
- Las funciones `calculateProductRefund` y `getRefundBreakdown` no incluyen delivery fee, lo cual es correcto

### Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `src/lib/refundCalculations.ts` | Incluir `deliveryFee` en `calculatePackageRefund` y `getPackageRefundBreakdown` |
| `src/components/dashboard/PackageCancellationModal.tsx` | Mostrar delivery fee como reembolsable (sin tachado) |
| `src/components/admin/AdminRefundsTab.tsx` | Agregar línea de delivery fee en el desglose cuando aplique |

### Resultado esperado

Para un pedido de 1 producto cancelado con tip Q140, fee Q70, delivery Q25:
- Tip del viajero: Q140.00
- Fee de Favoron (50%): +Q70.00
- Delivery: +Q25.00
- Penalización: -Q5.00
- **Total Reembolso: Q230.00**

