

## Mostrar User ID en UserDetailModal

### Cambio — `src/components/admin/UserDetailModal.tsx`

Agregar un campo "User ID" en la sección de Datos Personales, después del grid de Nombre Completo / Nombre de Usuario (línea ~285).

- Nuevo bloque con `Label` "User ID" y el valor `user.id`
- Texto con `font-mono text-xs` para que se vea como un identificador técnico
- Agregar un botón pequeño de copiar (icono `Copy`) que copie el ID al clipboard
- Solo lectura, no editable incluso en modo edición
- Ocupa el ancho completo (span 2 columnas) para que el UUID largo se vea bien

