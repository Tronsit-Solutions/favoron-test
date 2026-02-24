

## Agregar Costos de Incidencias a Unit Economics

### Concepto

Crear un registro manual mensual de costos por incidencias (paquetes perdidos, compensaciones, etc.) e integrarlo en los unit economics para ver el impacto real en la rentabilidad.

### Nueva tabla en Supabase

**`incident_costs`** - Registro manual de gastos por incidencias:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| month | text | Mes (yyyy-MM) |
| amount | numeric | Monto gastado (Q) |
| description | text | Descripcion del gasto |
| created_at | timestamptz | Fecha de creacion |
| created_by | uuid | Admin que registro |

RLS: Solo admins pueden ver y gestionar.

### Cambios en archivos

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCACAnalytics.tsx` | Fetch `incident_costs`. Agregar `incidentCosts` a `ShopperKPIs`. Calcular `netRevenue = revenue - incidentCosts` y `netLTV = netRevenue / monetizados` |
| `src/components/admin/cac/CACKPICards.tsx` | Agregar KPI card "Costo Incidencias" y "LTV Neto" en la seccion Shoppers |
| `src/components/admin/cac/CACAnalysisTab.tsx` | Agregar seccion de gestion de costos de incidencias (formulario CRUD similar al de inversiones). Incluir en exportacion Excel |

### Detalle tecnico

**Nueva query en `useCACAnalytics.tsx`:**

```text
Query: supabase.from('incident_costs').select('*')
Agrupacion: sumar por mes (o global si no hay filtro de mes)

Nuevos campos en ShopperKPIs:
- totalIncidentCosts: suma total de costos de incidencias
- netRevenue: shopperRevenue - totalIncidentCosts
- netLTV: netRevenue / monetizedShoppers
- netLtvCacRatio: netLTV / shopperCAC
```

**Nuevos KPI cards (Shoppers):**

- "Costo Incidencias": Monto total gastado en incidencias, icono de alerta, color rojo
- "LTV Neto": LTV despues de restar costos de incidencias (netRevenue / monetizados)

**Formulario de costos de incidencias:**

Se agrega debajo de la seccion de inversiones, con un formulario similar:
- Selector de mes (ultimos 12 meses)
- Monto (Q)
- Descripcion (texto libre)
- Boton agregar/editar/eliminar
- Tabla con los registros existentes

**Mutations CRUD** (igual patron que `addInvestment`/`deleteInvestment`/`updateInvestment`):
- `addIncidentCost`
- `updateIncidentCost`
- `deleteIncidentCost`

**Exportacion Excel:** Agregar hoja "Costos Incidencias" con mes, monto y descripcion, y agregar campo "Costo Incidencias" y "LTV Neto" a la hoja de KPIs Shoppers.

### Impacto en metricas

```text
Antes:
  LTV = Revenue / Monetizados

Ahora:
  LTV Bruto = Revenue / Monetizados (se mantiene)
  LTV Neto  = (Revenue - Costos Incidencias) / Monetizados (nuevo)
  LTV/CAC Neto = LTV Neto / CAC (nuevo)
```

Esto permite ver cuanto afectan las incidencias a la rentabilidad real por usuario adquirido.
