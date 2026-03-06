

## Botón de chat más grande + modal de chat

### Cambios

**Ambos archivos: `CollapsiblePackageCard.tsx` y `CollapsibleTravelerPackageCard.tsx`**:

1. **Agrandar el botón de chat**: Cambiar de `h-8 w-8` / `h-9 w-9` a `h-10 w-10` y el ícono de `h-5 w-5` a `h-6 w-6`. Agregar un fondo sutil (`bg-primary/10`) para que sea más visible.

2. **Cambiar `handleChatClick`**: En vez de expandir la card y cambiar al tab "chat", abrir un **modal/dialog** con el `PackageTimeline` (el mismo componente de chat que ya se usa en las cards y en `MatchChatModal`).

3. **Agregar un `Dialog`** dentro de cada componente:
   - Estado `chatModalOpen` (boolean)
   - `handleChatClick` → setea `chatModalOpen = true` (sin expandir la card)
   - El dialog muestra: header con nombre del paquete + `PackageTimeline` ocupando el espacio restante
   - Mismo layout que `MatchChatModal`: `max-w-4xl h-[85vh] flex flex-col`

### Archivos a modificar
- `src/components/dashboard/CollapsiblePackageCard.tsx` — Agrandar botón, agregar chat modal
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx` — Agrandar botón, agregar chat modal

