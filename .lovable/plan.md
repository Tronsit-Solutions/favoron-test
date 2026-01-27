

# Plan: Agregar Guatemala como Opción de Origen para Pedidos Personales

## Problema Identificado

En el formulario de nueva solicitud de paquete, cuando es un **pedido personal**, el dropdown de "¿En qué país está tu PAQUETE?" no incluye Guatemala como opción.

### Ubicación del código
**Archivo:** `src/components/PackageRequestForm.tsx`  
**Líneas:** 241-246

```typescript
// Código actual (sin Guatemala)
const purchaseOrigins = [
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];
```

---

## Solución

Agregar Guatemala como primera opción en la lista de `purchaseOrigins`:

```typescript
const purchaseOrigins = [
  { value: 'Guatemala', label: 'Guatemala' },      // ← NUEVO
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro' }
];
```

---

## Cambio Requerido

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `src/components/PackageRequestForm.tsx` | 241-246 | Agregar `{ value: 'Guatemala', label: 'Guatemala' }` al inicio del array |

---

## Resultado

El dropdown de país de origen para pedidos personales mostrará:
- Guatemala (nuevo)
- Estados Unidos
- España
- México
- Otro

