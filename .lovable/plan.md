

## Mostrar foto de perfil del viajero en el modal de Match y en el modal de Información del Viajero

### Cambios en `src/components/admin/AdminMatchDialog.tsx`

1. **Incluir `avatar_url` en la query de perfiles** (línea 412): Agregar `avatar_url` al select de la query que trae los perfiles de viajeros.

2. **Lista de viajes - Reemplazar el círculo gris con avatar** (línea 983): Cambiar el `div` con iniciales por un componente `Avatar` de Radix que muestre la foto del viajero (con fallback a las iniciales actuales).

3. **Modal "Información del Viajero" - Agregar avatar** (líneas 1537-1542): Junto al título "Perfil del Viajero", mostrar la foto de perfil del viajero seleccionado usando el componente `Avatar`.

4. **Imports**: Agregar `Avatar, AvatarImage, AvatarFallback` de `@/components/ui/avatar`.

Aplicar lo mismo en las otras secciones de trips del mismo archivo (otras ciudades ~línea 1217, otros países ~línea 1348) que también tienen el círculo gris.

