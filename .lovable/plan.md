
## Corregir opciones de entrega para Madrid

### Problema
Cuando el destino es Madrid (punto de entrega internacional), se muestra la opción "Entrega a mensajero Favorón" que solo aplica para Guatemala. La segunda opción debería ser "Me coordino con el shopper".

### Lógica actual vs deseada

| Destino | Opción 1 | Opción 2 (actual) | Opción 2 (deseada) |
|---------|----------|-------------------|-------------------|
| Guatemala | Oficina | Mensajero | Mensajero |
| Madrid (int'l con delivery point) | Oficina | Mensajero | Coordinación shopper |
| Otro internacional | Correo | Coord. shopper | Coord. shopper |

### Cambio en TripForm.tsx

**Archivo:** `src/components/TripForm.tsx` (líneas 1145-1197)

Modificar la sección que muestra las opciones cuando `hasOfficialDeliveryOptions` es true:

```tsx
{hasOfficialDeliveryOptions && (
  <>
    {/* Opción 1: Oficina - siempre se muestra */}
    <div ...>
      <p>Entrego en oficina de Favorón</p>
      <p>{isDestinationGuatemala ? 'Zona 14...' : destinationDeliveryPoint?.instructions...}</p>
    </div>
    
    {/* Opción 2: Mensajero SOLO para Guatemala */}
    {isDestinationGuatemala && (
      <div ...>
        <p>Entrega a mensajero Favorón</p>
        <p>Q25–Q40 según dirección</p>
      </div>
    )}
    
    {/* Opción 2 alternativa: Coordinación SOLO para internacionales */}
    {!isDestinationGuatemala && (
      <div ...>
        <p>🤝 Me coordino con el shopper</p>
        <p>Acordaré la entrega directamente con el comprador</p>
      </div>
    )}
  </>
)}
```

### Resultado esperado

**Guatemala:**
- Entrego en oficina de Favorón (Zona 14)
- Entrega a mensajero Favorón (Q25-Q40)

**Madrid:**
- Entrego en oficina de Favorón (Zona Bernabéu)
- Me coordino con el shopper
