

## Plan: Simplify Packages Chart to Bar Chart

The "Evolución de Solicitudes" chart uses a **stacked AreaChart** with `stackId="1"`, which visually stacks the values on top of each other — making it look like accumulated data instead of monthly counts per status.

### Fix: Convert to grouped BarChart

Replace the stacked `AreaChart` with a grouped `BarChart` so each month shows individual bars for Completados, En Proceso, and Cancelados side by side.

### Changes in `src/components/admin/charts/PackagesChart.tsx`:
- Replace `AreaChart` + `Area` imports with `BarChart` + `Bar`
- Remove gradient `<defs>` (not needed for bars)
- Use 3 `<Bar>` components without `stackId` so they render side by side
- Add `radius={[4,4,0,0]}` for rounded tops

