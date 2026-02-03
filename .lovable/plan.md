

## Separar Viajes y Pedidos en Tablas Independientes

### Objetivo
Crear dos tablas separadas dentro del tab Timeline para mostrar viajes y pedidos de forma independiente, mejorando la claridad y usabilidad.

### Diseño propuesto
Usar **sub-tabs** dentro del Timeline para alternar entre:
- **Viajes** (239 registros)
- **Pedidos** (1000 registros)

Cada tabla tendrá columnas optimizadas para su tipo de datos específico.

### Estructura visual

```text
┌─────────────────────────────────────────────────────────┐
│  📊 Stats Cards (igual que ahora)                       │
├─────────────────────────────────────────────────────────┤
│  🔍 Filtros (búsqueda, estado, fecha)                   │
├─────────────────────────────────────────────────────────┤
│  [✈️ Viajes (239)]  [📦 Pedidos (1000)]  <- Sub-tabs    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tabla específica según tab seleccionado                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cambios técnicos

**Archivo:** `src/components/admin/ActivityTimelineTab.tsx`

1. **Agregar estado para sub-tab activo**
   ```typescript
   const [activeSubTab, setActiveSubTab] = useState<'trips' | 'packages'>('trips');
   ```

2. **Separar actividades por tipo**
   ```typescript
   const tripActivities = activities.filter(a => a.type === 'trip');
   const packageActivities = activities.filter(a => a.type === 'package');
   ```

3. **Crear sub-tabs UI**
   - Usar componente `Tabs` de Radix existente
   - Badge con contador en cada tab

4. **Tabla de Viajes** (columnas optimizadas):
   | Usuario | WhatsApp | Canal | Ruta | Llegada | Estado | Paquetes |
   
5. **Tabla de Pedidos** (columnas optimizadas):
   | Usuario | WhatsApp | Canal | Descripción | Fecha | Estado | Monto |

6. **Actualizar filtros**
   - Remover filtro de "Tipo" (ya no necesario con tabs)
   - Ajustar filtros de estado según tab activo

7. **Actualizar export Excel**
   - Exportar datos del tab activo o ambos

### Beneficios
- Columnas específicas para cada tipo de dato
- Vista más limpia y enfocada
- Navegación clara entre viajes y pedidos
- Filtros más relevantes por contexto

