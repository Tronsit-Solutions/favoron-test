

## Fix: Garantizar que el menú y chat siempre sean visibles en móvil

### Problema
En tarjetas con títulos largos o mucho contenido (badges "Compitiendo", botones de acción), la columna derecha (menú ··· y chat) se pierde o queda inaccesible. El `overflow-hidden` actual solo oculta el contenido que sobresale en vez de redimensionarlo correctamente.

### Solución

**Archivo: `src/components/dashboard/CollapsiblePackageCard.tsx`**

Cambiar la estrategia del layout móvil:

1. **Columna derecha con ancho fijo**: Dar a la columna derecha (menú + chat) un ancho fijo explícito (`w-10`) para que nunca se comprima.

2. **Columna izquierda calculada**: Cambiar de `flex-1 min-w-0` a un ancho calculado con `calc(100% - 48px)` para que la columna izquierda nunca empuje a la derecha fuera de la pantalla.

3. **Botones de acción con ancho restringido**: Los botones internos que usan `w-full` (como "Ver Cotizaciones", "Recolectar paquete") deben respetar el contenedor padre. Agregar `max-w-full` y `overflow-hidden` donde sea necesario.

### Cambios específicos

- **Línea ~419** (contenedor flex principal): Mantener `overflow-hidden`
- **Línea ~421** (columna izquierda): Cambiar a `style={{ width: 'calc(100% - 48px)' }}` con `min-w-0 overflow-hidden`
- **Línea ~702** (columna derecha): Agregar `w-10` para ancho fijo explícito
- **Línea ~496** (botón "Ver productos"): Cambiar `w-full` por `max-w-full` para evitar desbordamiento

Un solo archivo modificado, solo cambios CSS/layout.

