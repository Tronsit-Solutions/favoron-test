

## Selector de usuarios en AddReferralDialog

Reemplazar los inputs de texto libre por campos de búsqueda con autocompletado que muestren usuarios reales de la base de datos.

### Cambios en `src/components/admin/referrals/AddReferralDialog.tsx`

- Agregar un componente de búsqueda tipo "combobox" usando `cmdk` (ya instalado) + Popover de Radix
- Cada campo (referidor y referido) tendrá un input donde el admin escribe al menos 2 caracteres
- Se hace una búsqueda en `profiles` con `ilike` sobre `first_name`, `last_name`, o `email`
- Los resultados se muestran en un dropdown con formato: **Nombre Apellido** + email debajo
- Al seleccionar, se guarda el `id` del profile directamente (ya no se busca por email al crear)
- Validación: ambos usuarios deben estar seleccionados y ser diferentes
- El estado pasa de `referrerEmail/referredEmail` (strings) a `referrer/referred` (objetos `{id, name, email}`)

### UX
- Input con debounce de 300ms para no saturar queries
- Mostrar "Buscando..." mientras carga
- Mostrar "No se encontraron usuarios" si no hay resultados
- Chip/badge visible con el usuario seleccionado, con X para deseleccionar

