

## Rediseño Compacto del Modal "Tip Asignado" (Vista Viajero)

### Problema
El modal tiene demasiado espacio vertical desperdiciado: padding generoso, sección header con icono grande, cada producto repite el indicador de empaque con texto explicativo largo, y los botones "Ver producto en tienda" ocupan ancho completo. Todo esto fuerza scroll innecesario.

### Cambios en `src/components/QuoteDialog.tsx`

**1. Hero Tip Card - Más compacto**
- Reducir el icono de `w-12 h-12` a `w-10 h-10`
- Reducir el texto del monto de `text-3xl` a `text-2xl`
- Reducir padding de `p-4` a `p-3`

**2. Sección "Producto solicitado" - Header inline**
- Eliminar el contenedor con fondo del header (el `w-8 h-8` rounded-lg) y usar solo el icono + texto en una línea más simple
- Reducir el `space-y-3` entre productos a `space-y-2`

**3. Product Cards - Layout más denso**
- Poner nombre del producto, precio/cantidad y tip en líneas más compactas
- Combinar el indicador de empaque en una sola línea corta sin el texto explicativo largo (eliminar el `<span>` con la explicación "Se refiere al empaque..." / "Puedes descartar...")
- Cambiar el botón "Ver producto en tienda" de `w-full` a un link inline pequeño junto al precio, similar a como se hace en la vista shopper (`inline-flex items-center gap-1 text-primary hover:underline`)
- Reducir padding interno de las cards de `p-3` a `p-2.5`
- Reducir margins bottom (`mb-3` a `mb-1.5`, `mb-2` a `mb-1`)

**4. Notas adicionales del Shopper**
- Sin cambios, ya es compacto

### Resultado Esperado
- Cada producto ocupa ~40% menos altura vertical
- El modal muestra 2-3 productos sin scroll en la mayoría de pantallas
- La información clave (nombre, precio, tip, link) sigue visible pero en layout más eficiente

