
# Plan: Corregir "Entrega: No seleccionado" para Devoluciones

## Problema

El resumen de la solicitud (Step 4) no reconoce los nuevos métodos de entrega para devoluciones (`return_dropoff` y `return_pickup`), por lo que muestra "No seleccionado".

## Archivo: `src/components/PackageRequestForm.tsx`

### Cambio en líneas 1407-1412

Actualizar la lógica de renderizado para incluir los nuevos métodos:

**Antes:**
```typescript
{formData.deliveryMethod === 'pickup' 
  ? 'Recoger en oficina (zona 14)' 
  : formData.deliveryMethod === 'delivery'
    ? `Domicilio: ${addressData?.streetAddress || 'Sin dirección'}`
    : 'No seleccionado'
}
```

**Después:**
```typescript
{formData.deliveryMethod === 'pickup' 
  ? 'Recoger en oficina (zona 14)' 
  : formData.deliveryMethod === 'delivery'
    ? `Domicilio: ${addressData?.streetAddress || 'Sin dirección'}`
    : formData.deliveryMethod === 'return_dropoff'
      ? 'Punto de devolución (UPS/FedEx/etc.)'
      : formData.deliveryMethod === 'return_pickup'
        ? 'Pickup programado en domicilio del viajero'
        : 'No seleccionado'
}
```

## Resultado

| Método | Texto en resumen |
|--------|------------------|
| `pickup` | Recoger en oficina (zona 14) |
| `delivery` | Domicilio: [dirección] |
| `return_dropoff` | Punto de devolución (UPS/FedEx/etc.) |
| `return_pickup` | Pickup programado en domicilio del viajero |
| otro/vacío | No seleccionado |
