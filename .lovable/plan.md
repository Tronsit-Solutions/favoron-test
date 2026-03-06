

## Alinear zona horaria de la gráfica con la tabla financiera

### Problema

La RPC `get_monthly_package_stats` agrupa paquetes por mes usando `to_char(p.created_at, 'YYYY-MM')` que opera en UTC. La Tabla Resumen Financiera usa JavaScript `startOfMonth`/`addMonths` que opera en la zona horaria local del navegador (Guatemala, UTC-6).

Esto causa que paquetes creados entre 6pm-12am hora Guatemala se asignen al mes siguiente en la gráfica pero al mes correcto en la tabla.

### Solución

Actualizar la RPC `get_monthly_package_stats` para usar `AT TIME ZONE 'America/Guatemala'` al agrupar por mes. También actualizar las RPCs `get_monthly_user_counts` y `get_monthly_trip_stats` para consistencia.

### Cambios

**1. Migración SQL** - Actualizar las 3 RPCs de reportes:
- `get_monthly_package_stats`: cambiar `to_char(p.created_at, 'YYYY-MM')` a `to_char(p.created_at AT TIME ZONE 'America/Guatemala', 'YYYY-MM')`
- `get_monthly_user_counts`: mismo cambio con `created_at`
- `get_monthly_trip_stats`: mismo cambio con `created_at`

No se requieren cambios en archivos TypeScript ya que el hook `useDynamicReports` consume los datos del RPC directamente por la llave `month` retornada.

