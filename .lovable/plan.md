

## Dividir Unit Economics: Shoppers vs Viajeros

### Concepto

Actualmente todas las metricas estan mezcladas en un solo dashboard. La idea es crear dos secciones separadas de unit economics, cada una con su propio funnel, KPIs y tabla:

**Shopper Unit Economics:**
- Funnel: Registrado → Creo paquete (activo) → Pago paquete (monetizado)
- Revenue: Service fees
- CAC: Inversion atribuida a shoppers / shoppers monetizados
- LTV: Revenue promedio por shopper monetizado
- ARPU: Revenue / shoppers activos

**Traveler Unit Economics:**
- Funnel: Registrado → Creo viaje (activo) → Entrego paquetes (productivo)
- No genera revenue directo, pero habilita el servicio
- CAC: Inversion atribuida a viajeros / viajeros productivos
- Valor: Paquetes entregados promedio por viajero, propinas promedio
- Costo por paquete entregado: Inversion viajeros / total paquetes entregados

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCACAnalytics.tsx` | Fetch trips. Separar metricas en `shopperKPIs` y `travelerKPIs`. Identificar viajeros activos (con trip) y productivos (con paquetes entregados en sus trips) |
| `src/components/admin/cac/CACKPICards.tsx` | Dividir en dos filas de KPIs: una para shoppers, otra para viajeros, con titulos de seccion |
| `src/components/admin/cac/CACTable.tsx` | Agregar prop para modo shopper/traveler y mostrar columnas relevantes a cada tipo |
| `src/components/admin/cac/CACAnalysisTab.tsx` | Reorganizar layout con dos secciones claras: "Unit Economics Shoppers" y "Unit Economics Viajeros" con sus respectivas tablas y KPIs |
| `src/components/admin/cac/FunnelChart.tsx` | Agregar soporte para funnel de viajeros (Registrados → Con viaje → Productivos) |

### Detalle tecnico

**`useCACAnalytics.tsx` - Nuevos datos:**

```text
Query adicional:
- trips: select('id, user_id, status') para identificar viajeros
- packages con matched_trip_id para saber que viajeros entregaron paquetes

Nuevos sets:
- travelerUserIds: usuarios con al menos 1 trip
- productiveTravelerIds: usuarios cuyo trip tiene paquetes en status completado/entregado
- pureTravelerIds: usuarios con trips pero sin paquetes propios (no son shoppers)

Nuevas interfaces:
- ShopperKPIs: totalShoppers, activeShoppers, monetizedShoppers, shopperCAC, shopperLTV, shopperARPU, shopperInvestment
- TravelerKPIs: totalTravelers, activeTravelers (con trip aprobado), productiveTravelers (entregaron paquetes), travelerCAC, avgPackagesPerTraveler, travelerInvestment, costPerDeliveredPackage
```

**Logica de atribucion de inversion (ya implementada parcialmente):**
- `target_audience = 'shoppers'` → 100% a shopperInvestment, 0% a travelerInvestment
- `target_audience = 'travelers'` → 0% a shopperInvestment, 100% a travelerInvestment
- `target_audience = 'both'` → 50% a cada uno

**`CACAnalysisTab.tsx` - Nueva estructura:**

```text
┌─────────────────────────────────────────────┐
│ Analisis de CAC              [Exportar Excel]│
├─────────────────────────────────────────────┤
│ Gestion de Inversiones  │ Funnel por Canal  │
├─────────────────────────────────────────────┤
│                                             │
│ ── Unit Economics: Shoppers ──              │
│ [KPIs Shoppers: CAC, LTV, LTV/CAC, ARPU...│
│ [Tabla detallada por canal - shoppers]      │
│                                             │
│ ── Unit Economics: Viajeros ──              │
│ [KPIs Viajeros: CAC, Productivos, Cost/Pkg]│
│ [Tabla detallada por canal - viajeros]      │
│                                             │
│ ── Evolucion Mensual ──                     │
│ [Tabla mensual existente]                   │
└─────────────────────────────────────────────┘
```

**KPIs Shoppers (fila):**
- CAC Shoppers: shopperInvestment / monetizedShoppers
- LTV: revenue / monetizedShoppers
- LTV/CAC
- Tasa Conversion: registrados → monetizados
- Shoppers Activos / Total
- Monetizados
- ARPU: revenue / activeShoppers

**KPIs Viajeros (fila):**
- CAC Viajeros: travelerInvestment / productiveTravelers
- Viajeros Activos (con trip) / Total registrados con trip
- Viajeros Productivos (entregaron paquetes)
- Paquetes promedio por viajero
- Costo por paquete entregado: travelerInvestment / totalPackagesDelivered
- Propinas totales distribuidas

**`CACTable.tsx` - Modo dual:**
- Recibe prop `mode: 'shopper' | 'traveler'`
- En modo shopper: columnas actuales (Registrados, Activos, Monetizados, CAC, LTV, LTV/CAC)
- En modo traveler: columnas (Registrados con trip, Con trip activo, Productivos, Inversion, CAC Viajero, Pkgs/Viajero)

**Channel data ampliado en `CACChannelData`:**
- Agregar: `travelerUsers`, `activeTravelers`, `productiveTravelers`, `travelerInvestment`, `travelerCAC`, `packagesDelivered`

