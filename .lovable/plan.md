

## Renombrar "Dashboard" a "God Mode" y crear dashboard editable para admins

### Concepto
Una pestaña "God Mode" con un grid de widgets configurables. El admin puede agregar/quitar widgets de un catálogo de componentes existentes y reordenarlos. La configuración se persiste en `localStorage` por usuario.

### Widgets disponibles (componentes existentes)
Del catálogo de charts y componentes ya construidos:
1. **AdminStatsOverview** — Stats cards (paquetes, viajes, matches, entregados)
2. **KPICards** — KPIs dinámicos (revenue, GMV, etc.)
3. **UserGrowthChart** — Crecimiento de usuarios
4. **PackagesChart** — Gráfico de paquetes por mes
5. **TripsChart** — Gráfico de viajes
6. **RevenueChart** — Ingresos por servicio
7. **GMVChart** — GMV mensual
8. **ServiceFeeGrowthChart** — Crecimiento de service fees
9. **AvgPackageValueChart** — Valor promedio por paquete
10. **AcquisitionChart** — Canales de adquisición
11. **AcquisitionSurveyTable** — Tabla de encuestas
12. **TravelerTipsCard** — Propinas de viajeros
13. **CACKPICards** — Unit Economics KPIs
14. **FunnelChart** — Funnel de conversión

### Cambios

**`src/components/Dashboard.tsx`**:
- Renombrar el `TabsTrigger` de "Dashboard" a "God Mode"
- Reemplazar el placeholder `TabsContent` con el nuevo componente `<GodModeDashboard />`

**Nuevo: `src/components/admin/GodModeDashboard.tsx`**:
- Estado: `activeWidgets: string[]` (IDs de widgets activos, orden = posición)
- Persistencia en `localStorage` key `god_mode_widgets_{userId}`
- Catálogo de widgets con id, nombre, icono, y componente React
- **Modo edición** (toggle button): muestra botones para quitar widgets y un selector para agregar nuevos
- **Reordenar**: botones ↑/↓ en cada widget en modo edición
- **Renderizado**: itera `activeWidgets` y renderiza cada componente en un grid responsive
- Cada widget se envuelve en un contenedor con título y botón de eliminar (en modo edición)
- Los widgets que requieren datos (charts) usarán los hooks existentes (`useDynamicReportsData`, `useCACAnalytics`, etc.) internamente — cada chart ya es auto-contenido con su propio data fetching
- Default inicial: `['stats-overview', 'kpi-cards', 'user-growth', 'revenue']`

**Nuevo: `src/components/admin/GodModeWidgetPicker.tsx`**:
- Modal/popover que muestra los widgets no activos del catálogo
- Click en uno lo agrega al final de `activeWidgets`

### UX
- Botón "Editar Dashboard" (icono Settings) en la esquina superior derecha
- En modo edición: cada widget tiene un overlay con botones ↑↓ y ✕
- Botón "Agregar Widget" que abre el picker
- Botón "Listo" para salir del modo edición
- Sin drag-and-drop (evita dependencias extra), solo ↑/↓

### Consideraciones técnicas
- No se necesitan nuevos paquetes — todo con componentes existentes y `localStorage`
- Los charts existentes ya tienen sus propios hooks de datos, no necesitan props externos
- Algunos widgets (como `AdminStatsOverview`) sí necesitan `packages` y `trips` como props — se pasarán desde el dashboard state
- El `useDashboardState` ya tiene `isAdminTab` incluyendo `admin-dashboard`, así que los datos admin se cargan correctamente

