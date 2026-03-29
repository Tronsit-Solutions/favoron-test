

## Mejorar visualización de paquetes con asignaciones inactivas (expired/cancelled/lost)

### Problema
1. El botón "Ver y Aceptar Tip" se muestra en paquetes con asignaciones terminales (expired, cancelled, lost) — no debería aparecer
2. El botón "Descartar de mi dashboard" está abajo a la izquierda, poco visible
3. Los paquetes inactivos se ven igual que los activos, sin distinción visual

### Cambios

**1. `TravelerPackagePriorityActions.tsx` — Ocultar acciones para asignaciones terminales**
- Al inicio del componente, agregar condición: si `_assignmentStatus` es `bid_lost`, `bid_expired`, o `bid_cancelled`, retornar `null` (no renderizar nada)
- Esto elimina el botón "Ver y Aceptar Tip" de estos paquetes

**2. `CollapsibleTravelerPackageCard.tsx` — Rediseñar estado terminal**
- En el wrapper del card (línea ~300), agregar `opacity-60` cuando la asignación es terminal (`bid_lost`, `bid_expired`, `bid_cancelled`)
- Mover los botones "Descartar de mi dashboard" de la sección de status (izquierda) a la esquina superior derecha del card, como un botón con ícono X más prominente y alineado a la derecha
- Cambiar el layout de los status terminales: mostrar un banner horizontal con el mensaje de estado a la izquierda y el botón de descartar a la derecha en la misma fila

**3. Diseño del banner terminal (desktop y mobile)**
```text
┌─────────────────────────────────────────────────────┐
│ ⏰ Asignación expirada          [✕ Descartar]      │
│ ❌ Otro viajero fue seleccionado [✕ Descartar]     │
│ Asignación cancelada             [✕ Descartar]     │
└─────────────────────────────────────────────────────┘
```
- Reemplazar los 3 bloques individuales (líneas 430-453) con un layout `flex justify-between items-center` que tenga el mensaje a la izquierda y el botón a la derecha

### Archivos a modificar
- `src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx`
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`

