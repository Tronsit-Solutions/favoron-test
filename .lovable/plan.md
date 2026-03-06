

## Agregar pestaña de Incidencias al panel de Operaciones

### Resumen
Crear una nueva pestaña "Incidencias" al final del panel de operaciones que muestre todos los paquetes con `incident_flag === true`, permitiendo al equipo de operaciones ver y gestionar los paquetes con problemas.

### Archivos a modificar

**1. `src/hooks/useOperationsData.tsx`**
- Agregar un nuevo `useMemo` para `incidentPackages`: filtrar `allPackages` donde `incident_flag === true`
- Exponerlo en el return del hook

**2. `src/components/operations/OperationsIncidentsTab.tsx`** (nuevo)
- Componente similar a `OperationsCompletedTab` pero para incidencias
- Muestra lista de paquetes con `incident_flag`
- Cada paquete muestra: descripción, shopper, viajero, estado actual, `incident_status` (active/resolved), y un resumen del último entry en `incident_history`
- Badge visual diferenciando incidencias activas (rojo) vs resueltas (amarillo)

**3. `src/pages/Operations.tsx`**
- Agregar icono `AlertTriangle` de lucide-react
- Nueva tab trigger "Incidencias" con badge de conteo
- Nuevo div condicional renderizando `OperationsIncidentsTab`
- Cambiar grid de tabs de `grid-cols-5` a `grid-cols-6`

### Datos mostrados por paquete
- ID / descripción del paquete
- Nombre del shopper y viajero
- Estado del paquete (`status`)
- Estado de incidencia (`incident_status`: active/resolved)
- Última nota del historial de incidencias
- Fecha de la incidencia

