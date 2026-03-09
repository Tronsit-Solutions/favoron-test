

## Forzar alineación izquierda del status en cards de shopper

El contenedor del botón de status (línea 434) ya tiene `pl-5` pero no fuerza explícitamente la alineación izquierda. Para garantizar que siempre quede a la izquierda:

### Cambio en `src/components/dashboard/CollapsiblePackageCard.tsx`

**Línea 434** — Agregar `flex justify-start` al div contenedor del botón de status:
```
<div className="pl-5 flex justify-start">
```

Esto asegura que el botón con el badge de status siempre se alinee a la izquierda, independientemente de cualquier estilo heredado del padre.

