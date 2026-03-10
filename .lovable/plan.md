

## Plan: Mover pestaña "Aplicaciones" del Dashboard al Control Admin

### Cambios

**Modificar: `src/components/AdminDashboard.tsx`**
- Eliminar el import de `AdminApplicationsTab`
- Eliminar la entrada `"applications"` del array de tabs (~líneas 545-549)
- Eliminar el `<TabsContent value="applications">` (~líneas 664-666)

**Modificar: `src/pages/AdminControl.tsx`**
- Importar `AdminApplicationsTab`
- Agregar una nueva Card en el grid con icono `ClipboardList` (ya importado), título "Aplicaciones", descripción "Gestionar solicitudes de trabajo" y botón que navega a `/admin/applications`
- **O bien**, renderizar `AdminApplicationsTab` directamente debajo del grid de cards en la misma página

### Decisión de UX
Dado que en el dashboard las aplicaciones eran una pestaña con tabla completa, lo más limpio es:
- Agregar una Card de acceso rápido en el grid del Control Admin
- Crear una ruta `/admin/applications` con una página dedicada que renderice `AdminApplicationsTab`

### Archivos
1. **`src/components/AdminDashboard.tsx`** — quitar tab + contenido de applications
2. **`src/pages/AdminControl.tsx`** — agregar card "Aplicaciones" con navegación a `/admin/applications`
3. **Crear: `src/pages/AdminApplications.tsx`** — página wrapper con header + `AdminApplicationsTab`
4. **`src/App.tsx`** — agregar ruta `/admin/applications`

