

## Traducir estado "deadline_expired" al espanol en el dashboard

### Problema
Los paquetes con estado `deadline_expired` muestran el texto en ingles ("deadline_expired") tanto en el badge de estado como en la descripcion, porque este estado no esta incluido en los mapeos de traduccion.

### Cambios

**Archivo: `src/hooks/useStatusHelpers.tsx`**

1. Agregar `deadline_expired` al objeto `statusConfig` (entre `cancelled` y el cierre del objeto, linea ~106):
   - Label: "Fecha limite vencida"
   - Variant: "warning"

2. Agregar `deadline_expired` al objeto `colorMap` en `getStatusColor` (linea ~145):
   - Color: `hsl(var(--warning))`

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**

3. Agregar un case `deadline_expired` en la funcion de mensaje de estado (antes del `default` en linea ~217):
   - Mensaje: "Fecha limite vencida - Reprograma tu fecha de entrega"

**Archivo: `src/utils/statusHelpers.ts`** (getStatusBadge)

4. Agregar `deadline_expired` al `statusConfig` del archivo de utilidades:
   - Label: "Fecha limite vencida"
   - Variant: "warning"

Estos son los 3 lugares donde se mapean estados a texto visible. El estado `deadline_expired` ya existe en `MatchStatusBadge.tsx` (admin) correctamente traducido, solo falta en el dashboard del shopper.

