

## Agregar widget "Rating Global de la Plataforma" al God Mode

### Nuevo componente: `src/components/admin/charts/PlatformRatingCard.tsx`
Un widget compacto que consulta `platform_reviews` y muestra:
- **Rating promedio global** con estrellas visuales (usando `StarRating` existente)
- **Total de reviews**
- **% Recomendaría** (would_recommend)
- **% Volvería a usar** (would_use_again === "yes")

Layout: una card principal con el rating grande y estrellitas, y 3 mini-stats debajo. Reutiliza la misma lógica de `AdminPlatformReviewsTab` (líneas 53-62) pero en formato widget compacto, con su propio `useQuery`.

### Cambios en `GodModeDashboard.tsx`
1. Importar `PlatformRatingCard`
2. Agregar al `WIDGET_CATALOG`: `{ id: "platform-rating", name: "Rating Global", description: "Rating promedio de la plataforma", icon: Star }`
3. Agregar case en `renderWidget`: renderiza `<PlatformRatingCard />`
4. Agregar `"platform-rating"` al inicio de `DEFAULT_WIDGETS` para que sea lo primero que vean los admins

