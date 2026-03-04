

## Plan: Mejorar UX de los modales de edicion de pedidos y viajes

### Problemas actuales identificados

**EditPackageModal:**
1. No hay validacion visual - el usuario puede guardar con campos vacios sin feedback
2. No hay indicador claro de que campos estan bloqueados vs editables (solo un texto italic debajo de precios)
3. El ID del viaje se muestra completo (`#11f3f330-62ee...`) en vez del label number
4. No hay confirmacion visual de que se guardo exitosamente
5. El selector de destino usa listas hardcodeadas en vez de las mismas del formulario de creacion
6. No hay opcion de agregar notas adicionales por producto (solo a nivel pedido)

**EditTripModal:**
1. Es un formulario enorme de 700 lineas que muestra TODO de una vez - overwhelming para el usuario
2. Validacion con `alert()` nativo en vez de feedback inline
3. No hay indicador visual de que campos cambiaron vs originales
4. El trip ID completo se muestra en el titulo
5. No hay stepper ni indicador de progreso para saber donde estas

**TripCard:**
1. No hay boton visible de "Editar" - el usuario tiene que ir al detail modal y descubrir el boton ahi

### Cambios propuestos

**1. EditPackageModal.tsx - Mejoras de UX**
- Agregar validacion inline con mensajes de error en campos requeridos (link, descripcion)
- Mostrar badges claros de "Bloqueado" en campos no editables con icono de candado
- Cambiar el titulo para mostrar label_number o primeros 6 chars formateados
- Agregar indicador visual de cambios pendientes (badge "Cambios sin guardar")
- Toast de confirmacion al guardar exitosamente
- Mostrar diferencias: highlight en amarillo los campos que cambiaron respecto al original

**2. EditTripModal.tsx - Simplificar y mejorar feedback**
- Reemplazar `alert()` con validacion inline (bordes rojos + mensajes bajo cada campo)
- Agregar indicador visual de campos modificados (dot azul o borde azul en campos cambiados)
- Mostrar titulo corto: "Editar Viaje: Miami → Guatemala" en vez del UUID
- Agregar boton "Deshacer cambios" para resetear al original
- Agregar asteriscos rojos visibles en campos obligatorios que faltan

**3. TripCard.tsx - Acceso mas facil a editar**
- Agregar boton de "Editar" en el header del TripCard (junto al boton de detalle) para viajes en estado pending_approval/approved
- El boton abre directamente el TripEditSelectionModal para edicion granular

**4. CollapsiblePackageCard.tsx - Visibilidad del boton editar**
- Mantener el boton editar en el dropdown pero tambien mostrar un badge/boton sutil en el header cuando el pedido es editable y esta en estado que requiere accion (rejected, quote_rejected)

### Archivos a modificar
- `src/components/dashboard/EditPackageModal.tsx` - Validacion inline, badges bloqueados, indicador de cambios
- `src/components/EditTripModal.tsx` - Validacion inline, titulo descriptivo, indicador de cambios, boton deshacer
- `src/components/dashboard/TripCard.tsx` - Boton editar visible en header
- `src/components/dashboard/CollapsiblePackageCard.tsx` - Badge/boton editar mas visible en estados que lo requieren

