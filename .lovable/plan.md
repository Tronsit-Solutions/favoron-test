

## Reemplazar columna "Producto" por botón "Ver Pedido" con modal de detalles

### Problema
La columna "Producto" muestra texto truncado que no es útil. El usuario quiere ver detalles completos del pedido.

### Solución

**1. Ampliar datos en `useCustomerExperience.ts`**
- Agregar campos al select de packages: `estimated_price, delivery_deadline, additional_notes, created_at, label_number, delivery_method, package_destination`
- Agregar estos campos a la interfaz `CXPackageRow`
- Incluir nombre del viajero (para shoppers) y nombre del shopper (para viajeros) en los datos

**2. Crear modal `CXPackageDetailModal.tsx`**
- Dialog con detalles del pedido:
  - **Productos**: lista con descripción, precio, cantidad, link (reutilizar `PackageProductDisplay`)
  - **Info general**: fecha de creación, fecha límite, precio estimado, etiqueta, método de entrega, destino
  - **Notas adicionales** del pedido
  - **Viajero/Shopper**: nombre de quién trajo/pidió el paquete
- Diseño limpio con secciones separadas

**3. Modificar `CustomerExperienceTable.tsx`**
- Reemplazar la celda de texto truncado de "Producto" por un botón "Ver pedido" (icono `Eye`)
- Al hacer clic, abrir el modal con los detalles
- Cambiar header de "Producto" a "Pedido"

### Archivos
- **Modificar**: `src/hooks/useCustomerExperience.ts`, `src/components/admin/cx/CustomerExperienceTable.tsx`
- **Crear**: `src/components/admin/cx/CXPackageDetailModal.tsx`

