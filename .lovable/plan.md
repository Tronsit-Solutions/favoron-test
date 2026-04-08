
Objetivo: hacer que los preview cards de paquetes usen el mismo límite derecho visible que el navbar superior y el botón “Nuevo Pedido”, también cuando ya hay paquetes cargados.

Plan

1. Corregir el contenedor de la lista de paquetes en `src/components/Dashboard.tsx`
- En la rama donde sí existen paquetes, añadir padding-right móvil explícito (`pr-4` o equivalente) al contenedor de la grilla.
- Quitar `overflow-x-clip` de esa grilla, porque está recortando el borde derecho y el área del menú `...`.
- Mantener `w-full max-w-full min-w-0 box-border` para que el ancho siga controlado por el mismo layout base.

2. Igualar el comportamiento con el empty state
- Tomar como referencia que el estado vacío sí se ve bien porque usa el espaciado lateral correcto.
- Hacer que la lista con paquetes use el mismo “safe area” horizontal que ya alinea el empty state, el navbar y el botón de acción.

3. Revisar el card de paquete para evitar recortes internos en móvil
- En `src/components/dashboard/CollapsiblePackageCard.tsx`, revisar los wrappers móviles que hoy usan `overflow-hidden` cerca del encabezado y la fila principal.
- Mantener `overflow-hidden` solo donde realmente se necesite para esquinas/redondeado, pero evitarlo en wrappers que puedan cortar el borde derecho visible o el botón `...`.
- Verificar especialmente el layout móvil que reserva espacio para la columna derecha del menú.

4. Mantener alineación visual consistente
- Confirmar que el borde derecho de cada card quede alineado con:
  - el borde derecho de la barra superior de tabs
  - el botón “Nuevo Pedido”
- Si hace falta, usar el mismo patrón de padding horizontal ya existente en utilidades móviles en vez de introducir otro espaciado distinto.

Detalles técnicos
- Archivo principal afectado: `src/components/Dashboard.tsx`
- Archivo secundario a ajustar si sigue habiendo clipping interno: `src/components/dashboard/CollapsiblePackageCard.tsx`
- Causa más probable encontrada:
  - el empty state usa un espaciado lateral correcto
  - la lista con paquetes usa un contenedor distinto
  - ese contenedor todavía tiene `overflow-x-clip`
  - además hay varios `overflow-hidden` dentro del card móvil que pueden empeorar el recorte visual

Resultado esperado
- El borde derecho de todos los cards vuelve a ser visible.
- El menú de tres puntos ya no queda cortado.
- La lista de paquetes se ve alineada con el navbar y con “Nuevo Pedido”, igual que cuando no hay paquetes.
