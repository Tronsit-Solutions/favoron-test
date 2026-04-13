

## Plan: Corregir alineacion inconsistente del preview card en movil

### Problema

En el layout movil del `CollapsiblePackageCard`, la columna izquierda del contenido tiene `pr-8` (padding-right de 2rem) fijo en la linea 463. Este padding fue disenado para dejar espacio al menu de tres puntos (posicionado absolutamente con `right-2`).

Sin embargo, cuando el boton de Chat esta presente (columna derecha del flex), el `pr-8` se suma al espacio que ya ocupa el boton de Chat, causando que el contenido se vea mas comprimido de lo necesario. Esto no deberia causar diferencia entre cards con el mismo estado... 

Revisando mas a fondo: el `pr-8` reserva espacio para los tres puntos que estan en `absolute top-2 right-2` **relativo al CardHeader**. Cuando hay Chat button, los tres puntos se posicionan sobre el Chat button area, no sobre el contenido. Pero el `pr-8` sigue empujando el texto a la izquierda innecesariamente cuando ya hay un Chat button.

La inconsistencia visual entre cards identicos (como "vinito" vs "Ron Botran") probablemente viene de que el Chat button tiene altura variable segun el contenido del left column (usa `items-end pb-1`), y la combinacion de `flex-1 min-w-0 pr-8` con el flex-shrink-0 del Chat puede producir anchos ligeramente diferentes segun como el browser resuelve el layout.

### Solucion

1. **Eliminar `pr-8` de la columna izquierda** (linea 463) y reemplazarlo con `pr-2` (padding minimo)
2. **Hacer que el three-dots menu se posicione relativo al wrapper del card (`relative` en linea 379)** en vez de relativo al CardHeader, para que no dependa del ancho del contenido interno
3. Asegurar que el flex container (linea 461) use `w-full` explicitamente para que todos los cards tengan el mismo ancho de contenido

### Cambio concreto

**Archivo**: `src/components/dashboard/CollapsiblePackageCard.tsx`

- **Linea 463**: Cambiar `pr-8` a `pr-2` — el three-dots menu ya esta absolutamente posicionado respecto al CardHeader, y el Chat button ya ocupa su propia columna flex
- **Linea 461**: Agregar `w-full` al flex container para forzar ancho consistente: `flex flex-row gap-2 w-full`

Esto asegura que todos los cards con el mismo layout (Chat + three-dots + action button) tengan exactamente el mismo ancho de contenido.

