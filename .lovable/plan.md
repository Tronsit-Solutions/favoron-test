

## Eliminar la pestaña "Chat" de las tarjetas expandidas (shopper y viajero)

Ya existe un botón de chat en el preview card, así que la pestaña "Chat" dentro del contenido expandido es redundante.

### Archivos a modificar

**1. `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**
- Eliminar los dos `TabsTrigger` con `value="chat"` (líneas ~556 y ~704 — versiones mobile y desktop)
- Eliminar los dos `TabsContent` con `value="chat"` (líneas ~663 y ~804) y todo su contenido
- Eliminar import de `MessageCircle` si ya no se usa en otro lugar del archivo

**2. `src/components/dashboard/CollapsiblePackageCard.tsx`**
- Eliminar el `TabsTrigger` con `value="chat"` (línea ~1022)
- Eliminar el `TabsContent` con `value="chat"` (línea ~1044) y todo su contenido
- Eliminar import de `MessageCircle` si ya no se usa en otro lugar del archivo

Las pestañas restantes serán: Producto, Estado, Docs.

