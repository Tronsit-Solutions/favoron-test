

## Excluir incidencias de la pestaña de Recepción

### Cambio en `src/hooks/useOperationsData.tsx`

Agregar `&& !p.incident_flag` al filtro de `receptionPackages` (línea 258-261) para que los paquetes con incidencia activa no aparezcan en la pestaña de Recepción (ya se muestran en la pestaña de Incidencias).

