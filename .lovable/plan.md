
# Plan: Mostrar Mensaje "Esperando Confirmación de Oficina" para Viajeros

## Contexto

Cuando el viajero declara la entrega de un paquete, el estado cambia a `pending_office_confirmation`. Sin embargo, el mensaje actual podría no ser lo suficientemente claro. El usuario solicita que el viajero vea un mensaje más claro indicando que está esperando la confirmación de la oficina de Favorón.

## Análisis del Código Actual

### Archivos involucrados:
- `src/components/dashboard/traveler/TravelerPackageStatusBadge.tsx` (líneas 93-100)
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` (líneas 442-446)

### Estado actual:
1. **Badge** (TravelerPackageStatusBadge): Muestra "⏳ Entregado" con `actionMessage`: "🔒 Entrega pendiente de confirmación..."
2. **Descripción en Card** (CollapsibleTravelerPackageCard): Muestra "⏳ Entregado - Esperando confirmación de oficina"

## Problema Identificado

El mensaje actual es correcto pero se puede mejorar para ser más claro y visible. También necesitamos asegurarnos de que en el estado `delivered_to_office` se distinga entre:
- **Confirmado por la oficina** → "Entregado en oficina - Confirmado"
- **No confirmado aún** → "Esperando confirmación de oficina"

## Cambios Propuestos

### 1. Archivo: `src/components/dashboard/traveler/TravelerPackageStatusBadge.tsx`

**Modificar estado `pending_office_confirmation` (líneas 93-100):**

| Campo | Antes | Después |
|-------|-------|---------|
| label | "Entregado" | "Esperando confirmación" |
| description | "Entregado - Esperando confirmación de oficina" | "Declaraste la entrega - Esperando que la oficina de Favorón confirme la recepción" |
| actionMessage | "🔒 Entrega pendiente de confirmación..." | "⏳ Has declarado la entrega del paquete. Una vez que Favorón confirme la recepción, podrás crear tu orden de cobro." |

**Modificar estado `delivered_to_office` (líneas 101-107):**

| Campo | Antes | Después |
|-------|-------|---------|
| actionMessage | (ninguno) | "✅ La oficina confirmó la recepción. Cuando todos tus paquetes estén confirmados podrás crear tu orden de cobro." |

### 2. Archivo: `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`

**Modificar mensaje para `pending_office_confirmation` (líneas 442-446):**

```typescript
// Antes:
{pkg.status === 'pending_office_confirmation' && (
  <div className="font-medium text-amber-600">
    ⏳ Entregado - Esperando confirmación de oficina
  </div>
)}

// Después:
{pkg.status === 'pending_office_confirmation' && (
  <div className="space-y-1">
    <div className="font-medium text-amber-600">
      ⏳ Esperando confirmación de oficina
    </div>
    <div className="text-xs text-muted-foreground">
      Has declarado la entrega. Podrás crear tu orden de cobro una vez que Favorón confirme la recepción.
    </div>
  </div>
)}
```

**Modificar mensaje para `delivered_to_office` (líneas 447-451):**

```typescript
// Antes:
{pkg.status === 'delivered_to_office' && (
  <div className="font-medium text-green-600">
    🏢 Listo para recolectar
  </div>
)}

// Después:
{pkg.status === 'delivered_to_office' && (
  <div className="space-y-1">
    <div className="font-medium text-green-600">
      ✅ Entrega confirmada por Favorón
    </div>
    <div className="text-xs text-muted-foreground">
      El paquete está listo para que el shopper lo recoja.
    </div>
  </div>
)}
```

## Flujo Visual para el Viajero

```text
┌────────────────────────────────────────────────────────────────┐
│  ESTADO: pending_office_confirmation                           │
├────────────────────────────────────────────────────────────────┤
│  Badge: ⏳ Esperando confirmación                              │
│  Mensaje: "Esperando confirmación de oficina"                  │
│  Submensaje: "Has declarado la entrega. Podrás crear tu       │
│              orden de cobro una vez que Favorón confirme."     │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│  ESTADO: delivered_to_office                                   │
├────────────────────────────────────────────────────────────────┤
│  Badge: ✅ Entrega confirmada                                  │
│  Mensaje: "Entrega confirmada por Favorón"                     │
│  Submensaje: "El paquete está listo para que el shopper       │
│              lo recoja."                                       │
└────────────────────────────────────────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/components/dashboard/traveler/TravelerPackageStatusBadge.tsx` | 93-100, 101-107 | Actualizar textos de estados |
| `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` | 442-451 | Mejorar mensajes de estado |

## Resultado Esperado

1. **Estado `pending_office_confirmation`**: El viajero ve claramente "Esperando confirmación de oficina" con una explicación de que debe esperar la confirmación de Favorón
2. **Estado `delivered_to_office`**: El viajero ve "Entrega confirmada por Favorón" indicando que la oficina ya confirmó la recepción

## Riesgo
**Muy bajo** - Solo modifica textos informativos sin afectar la lógica de negocio.
