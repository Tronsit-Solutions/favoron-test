

## Unificar Rating Cards en un solo recuadro

### Diseño

Crear un nuevo componente `CombinedRatingCard` que muestre ambos ratings (Shoppers y Viajeros) lado a lado en una sola card, con tabs o secciones visuales para cada uno.

**Layout propuesto:**
```text
┌─────────────────────────────────────────────┐
│ ⭐ Ratings de la Plataforma                │
├──────────────────┬──────────────────────────┤
│  Shoppers        │  Viajeros               │
│  4.8 ★★★★★      │  4.5 ★★★★☆             │
│  12 reviews      │  8 encuestas            │
├──────────────────┼──────────────────────────┤
│ Total: 12        │ Total: 8               │
│ Recomendaría: 92%│ Recomendaría: 88%      │
│ Volvería: 83%    │ Volvería: 75%          │
└──────────────────┴──────────────────────────┘
```

Al hacer click en cada lado, se abre el Sheet correspondiente (Platform Reviews o Traveler Surveys).

### Cambios

1. **Crear `src/components/admin/charts/CombinedRatingCard.tsx`** -- Nuevo componente que combina las queries y UI de ambos cards en uno solo, con dos columnas y sheets independientes para el detalle.

2. **`src/components/admin/GodModeDashboard.tsx`** -- Reemplazar los dos widgets separados (`platform-rating` y `traveler-rating`) por uno solo (`combined-rating`) que renderiza `CombinedRatingCard`. Actualizar el widget picker/config.

3. **Eliminar** `PlatformRatingCard.tsx` y `TravelerRatingCard.tsx` (o dejar sin uso).

