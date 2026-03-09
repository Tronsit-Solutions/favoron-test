

## Agregar widget "Rating Viajeros" al God Mode Dashboard

### Objetivo
Crear un widget similar a `PlatformRatingCard` (que muestra rating de shoppers desde `platform_reviews`) pero para viajeros, usando datos de `traveler_surveys`. Agregarlo al catálogo de widgets del God Mode.

### Cambios

**Nuevo: `src/components/admin/charts/TravelerRatingCard.tsx`**
- Componente espejo de `PlatformRatingCard` pero consultando `traveler_surveys` en vez de `platform_reviews`
- Query: `select rating, would_recommend, would_register_again from traveler_surveys`
- KPIs mostrados: rating promedio (con estrellas), total encuestas, % recomendaría, % volvería a registrar viaje (`would_register_again === "yes_sure" || "probably_yes"`)
- Click abre un `Sheet` lateral con `AdminTravelerSurveysTab` (igual que el patrón de `PlatformRatingCard` → `AdminPlatformReviewsTab`)
- Título: "Rating Viajeros" con icono `Plane` en color diferente al de shoppers

**Modificar: `src/components/admin/GodModeDashboard.tsx`**
- Importar `TravelerRatingCard`
- Agregar entrada al `WIDGET_CATALOG`: `{ id: "traveler-rating", name: "Rating Viajeros", description: "Rating de viajeros sobre la plataforma", icon: Plane }`
- Agregar case en `renderWidget`: `case "traveler-rating": return <TravelerRatingCard />`
- Renombrar el widget existente de "Rating Global" a "Rating Shoppers" para distinguirlo

