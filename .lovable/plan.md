

## Mover botones de prueba WhatsApp a la pagina de WhatsApp

### Que se hace
Remover los botones "Probar WhatsApp (Welcome v2)" y "Probar Todos (3)" del Panel de Administracion y de la pestana Ultima Milla, y colocarlos en la pagina dedicada de WhatsApp (`/admin/whatsapp`).

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/AdminStatsOverview.tsx` | Eliminar import y uso de `WhatsAppTestButton` |
| `src/components/admin/LastMileTab.tsx` | Eliminar import y uso de `WhatsAppTestButton` |
| `src/pages/AdminWhatsApp.tsx` | Agregar `WhatsAppTestButton` en el header, junto al boton "Actualizar" |

### Detalle tecnico

**`AdminStatsOverview.tsx`**: Se elimina el import de `WhatsAppTestButton` y el `div` con `mt-4 flex justify-end` que lo contiene (lineas 74-76).

**`LastMileTab.tsx`**: Se elimina el import y el uso de `<WhatsAppTestButton />` dentro del CardHeader de Ultima Milla (linea 253).

**`AdminWhatsApp.tsx`**: Se agrega `<WhatsAppTestButton />` en la seccion del header, entre el titulo y el boton de "Actualizar", para que sea facilmente accesible desde la pagina dedicada de WhatsApp.

