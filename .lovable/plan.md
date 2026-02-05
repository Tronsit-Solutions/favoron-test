

## Alinear "Instrucciones adicionales" con el resto de campos

### Problema
El campo "Instrucciones adicionales" tiene un layout vertical (label arriba, valor abajo) mientras que todos los demás campos usan un grid de 3 columnas (label a la izquierda, valor a la derecha).

### Cambio
En `src/components/dashboard/ShippingInfoModal.tsx`, líneas 102-107:

**Antes:**
```tsx
{travelerAddress.additionalInstructions && (
  <div className="mt-2 pt-2 border-t border-border">
    <div className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Instrucciones adicionales:</div>
    <div className="text-xs sm:text-sm">{travelerAddress.additionalInstructions}</div>
  </div>
)}
```

**Después:**
```tsx
{travelerAddress.additionalInstructions && (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
    <div className="text-xs sm:text-sm font-medium text-muted-foreground">Instrucciones adicionales:</div>
    <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.additionalInstructions}</div>
  </div>
)}
```

### Resultado
El valor "na" aparecerá en la misma columna que "Lucas Farias", "Hollywood Boulevard", etc.

