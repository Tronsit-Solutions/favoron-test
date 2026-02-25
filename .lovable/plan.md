

## Agregar Reviews de Viajeros y Plataforma a la página de Encuestas

### Cambio
Agregar dos secciones nuevas en `AdminSurveys.tsx` con pestañas (Tabs) para separar: Encuesta de Adquisición, Reviews de Viajeros, y Reviews de Plataforma.

### Estructura

La página actual solo muestra la encuesta de adquisición. Se reorganizará con Tabs:

```text
[Adquisición] [Reviews Viajeros] [Reviews Plataforma]
```

### Cambios en archivos

**1. `src/pages/AdminSurveys.tsx`**
- Importar `Tabs, TabsList, TabsTrigger, TabsContent`
- Importar dos nuevos componentes: `AdminTravelerRatingsTab` y `AdminPlatformReviewsTab`
- Mover el contenido actual de encuesta de adquisición dentro de `TabsContent value="acquisition"`
- Agregar tabs para los dos nuevos componentes
- El header y botones se mantienen arriba de los tabs

**2. Nuevo: `src/components/admin/AdminTravelerRatingsTab.tsx`**
- Query a `traveler_ratings` con join a `profiles` (para nombres de shopper y traveler) via dos queries separadas
- Tabla con columnas: Shopper, Viajero, Rating (estrellas), Condición del Producto, Entregó a Tiempo, Comentario, Fecha
- KPI cards arriba: Total ratings, Rating promedio, % entrega a tiempo
- Badge de colores para condición (good/fair/bad)

**3. Nuevo: `src/components/admin/AdminPlatformReviewsTab.tsx`**
- Query a `platform_reviews` con join a profiles para nombre del shopper
- Tabla con columnas: Shopper, Rating, Volvería a usar, Recomendaría, Proceso claro, Comunicación, Reseña, Consentimiento, Fecha
- KPI cards: Total reviews, Rating promedio, % recomendaría, % volvería a usar

### Detalle técnico
- Las queries usan `supabase.from('traveler_ratings').select('*')` y luego batch-fetch de profiles por IDs (ya que no hay FK directo expuesto al SDK)
- RLS ya permite a admins ver todos los ratings y reviews
- Se reutilizan componentes existentes: `Card`, `Table`, `Badge`, `StarRating` (solo display), `Skeleton`

