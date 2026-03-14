

## Optimización del Dashboard para iPhone

### Problemas detectados

1. **Header saturado**: Para admins hay 7+ botones en la barra (Home, Operations, WhatsApp, Settings, Notifications, Users, Profile). En iPhone se amontonan.
2. **Saludo ocupa mucho espacio vertical**: "¡Hola, Administrador! 👋" con `text-2xl` y `mb-6` consume espacio valioso en pantalla pequeña.
3. **QuickActions siempre apiladas en móvil**: Las cards de "Solicitar Favorón" y "Registrar Viaje" son altas con header + description + button, ocupando ~300px.
4. **Padding excesivo**: `py-4` en el container + `mb-6` del saludo + `space-y-6` en tabs = mucho espacio perdido.

### Cambios propuestos

**`src/components/dashboard/DashboardHeader.tsx`**
- En móvil, agrupar los botones secundarios de admin (Operations, WhatsApp, Settings, Users) dentro del DropdownMenu del perfil, dejando solo Logo + Home + Notifications + Avatar visibles.
- Reducir `py-3` a `py-2` en móvil.

**`src/components/Dashboard.tsx`**
- Reducir el saludo: de `text-2xl` a `text-xl` en móvil, reducir `mb-6` a `mb-3`.
- Reducir `py-4` del container a `py-2` en móvil.

**`src/components/dashboard/QuickActions.tsx`**
- En móvil, hacer las cards más compactas: ocultar `CardDescription`, reducir padding, mostrar solo icono + botón en una sola fila por card.

### Detalle técnico

**DashboardHeader** - Mover botones admin a dropdown en móvil:
```
Visible en móvil: [Logo] [Home] [Notifications] [Avatar▾]
Dentro del dropdown: Operations, WhatsApp, Settings, Users (solo en móvil)
```

**Dashboard greeting** - Reducir espacio:
- `mb-6 sm:mb-8` → `mb-2 sm:mb-6`
- `text-2xl sm:text-3xl` → `text-lg sm:text-3xl`
- `py-4 sm:py-6` → `py-2 sm:py-6`

**QuickActions** - Layout compacto en móvil:
- Usar 2 columnas en móvil con cards mínimas (icono + botón, sin descripción)
- O convertir en 2 botones horizontales sin cards

