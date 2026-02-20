

## Sistema de Calificaciones del Shopper - Plan Completo

### Resumen
El shopper realiza dos calificaciones separadas cuando su paquete llega a `completed`:
1. **Primero**: Califica al viajero (estrellas, condicion de productos, datos automaticos)
2. **Despues**: Califica a Favoron (estrellas, preguntas especificas, resena publica opcional)

Ambas son paginas/modales separados para no confundir al usuario. La calificacion de Favoron aparece solo despues de completar la del viajero.

---

### Flujo completo del shopper

```text
Paquete llega a "completed"
        |
        v
[Boton: "Calificar viajero"]
        |
        v
+-- Modal 1: Calificar Viajero --+
| Estrellas (1-5)                 |
| Estado productos (malo/reg/bien)|
| Auto: confirmo a tiempo? (S/N) |
| Auto: entrego a tiempo? (S/N)  |
| Comentario opcional             |
+---------------------------------+
        |
        v (despues de enviar)
[Boton: "Calificar tu experiencia con Favoron"]
        |
        v
+-- Modal 2: Calificar Favoron ---+
| Estrellas (1-5)                  |
| Volverias a usar Favoron? S/N/  |
|   Tal vez                        |
| Recomendarias Favoron? S/N      |
| El proceso fue claro? S/N       |
| Como fue la comunicacion?       |
|   Buena / Regular / Mala        |
| Resena (texto libre, opcional)  |
| [ ] Permito publicar mi resena  |
+---------------------------------+
        |
        v
Si consintio, la resena puede
mostrarse en la landing page
```

---

### Cambios en base de datos

**Tabla 1: `traveler_ratings` (ya planeada)**
- `id`, `package_id` (unique), `traveler_id`, `shopper_id`, `trip_id`
- `rating` (1-5), `product_condition` ('bad'/'fair'/'good')
- `traveler_confirmed` (boolean auto), `delivered_on_time` (boolean auto)
- `comment` (text opcional), `created_at`

**Tabla 2: `platform_reviews` (nueva)**
- `id` (uuid, PK)
- `package_id` (uuid, UNIQUE -- 1 por paquete)
- `shopper_id` (uuid)
- `rating` (integer, 1-5)
- `would_use_again` (text: 'yes', 'no', 'maybe')
- `would_recommend` (boolean)
- `process_was_clear` (boolean)
- `communication_quality` (text: 'good', 'fair', 'bad')
- `review_text` (text, opcional)
- `consent_to_publish` (boolean, default false)
- `created_at` (timestamptz)

**Columnas en `profiles` (nuevas)**
- `traveler_avg_rating` (numeric)
- `traveler_total_ratings` (integer, default 0)
- `traveler_ontime_rate` (numeric, porcentaje 0-100)

**Triggers**
- `update_traveler_rating_stats`: al insertar en `traveler_ratings`, recalcula stats en `profiles`

**RLS para `traveler_ratings`**
- Shoppers pueden insertar si el paquete les pertenece y esta en `completed`
- Shoppers pueden ver sus propias calificaciones
- Admins pueden ver todas
- No UPDATE ni DELETE

**RLS para `platform_reviews`**
- Shoppers pueden insertar si el paquete les pertenece y ya existe calificacion al viajero
- Shoppers pueden ver sus propias reviews
- Admins pueden ver todas
- No UPDATE ni DELETE
- Lectura publica de reviews con `consent_to_publish = true` (para landing page)

---

### Archivos a crear

**`src/components/ui/star-rating.tsx`**
- Componente reutilizable de estrellas (modo input y display)

**`src/components/dashboard/TravelerRatingModal.tsx`**
- Modal para calificar al viajero
- Estrellas, condicion de productos, datos auto (confirmo/entrego a tiempo), comentario

**`src/components/dashboard/PlatformReviewModal.tsx`**
- Modal para calificar a Favoron
- Estrellas, 4 preguntas especificas, texto libre, checkbox de consentimiento

---

### Archivos a modificar

**`src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`**
- En case `completed`:
  - Si no ha calificado al viajero: boton "Calificar viajero"
  - Si ya califico al viajero pero no a Favoron: boton "Calificar tu experiencia"
  - Si ya hizo ambas: mostrar estrellas dadas (solo lectura)

**`src/components/admin/UserDetailModal.tsx`**
- Mostrar rating promedio del viajero, total calificaciones, % entregas a tiempo

**`src/components/admin/matching/MatchCard.tsx`**
- Badge con rating promedio del viajero

**`src/components/admin/matching/TripCard.tsx`**
- Badge con rating promedio del viajero

**Landing page (futuro)**
- Las reviews con `consent_to_publish = true` podrian mostrarse en la seccion de testimonios (puede implementarse en una fase posterior)

---

### Detalle tecnico

Migracion SQL completa:
```sql
-- Tabla calificaciones al viajero
CREATE TABLE traveler_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE,
  traveler_id uuid NOT NULL,
  shopper_id uuid NOT NULL,
  trip_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  product_condition text NOT NULL CHECK (product_condition IN ('bad', 'fair', 'good')),
  traveler_confirmed boolean NOT NULL DEFAULT false,
  delivered_on_time boolean NOT NULL DEFAULT false,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE traveler_ratings ENABLE ROW LEVEL SECURITY;

-- Tabla reviews de la plataforma
CREATE TABLE platform_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL UNIQUE,
  shopper_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  would_use_again text NOT NULL CHECK (would_use_again IN ('yes', 'no', 'maybe')),
  would_recommend boolean NOT NULL,
  process_was_clear boolean NOT NULL,
  communication_quality text NOT NULL CHECK (communication_quality IN ('good', 'fair', 'bad')),
  review_text text,
  consent_to_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_reviews ENABLE ROW LEVEL SECURITY;

-- Columnas en profiles para stats del viajero
ALTER TABLE profiles ADD COLUMN traveler_avg_rating numeric;
ALTER TABLE profiles ADD COLUMN traveler_total_ratings integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN traveler_ontime_rate numeric;

-- Trigger para recalcular stats del viajero
CREATE OR REPLACE FUNCTION update_traveler_rating_stats()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET
    traveler_avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    traveler_total_ratings = (
      SELECT COUNT(*)
      FROM traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    traveler_ontime_rate = (
      SELECT ROUND(
        (COUNT(*) FILTER (WHERE delivered_on_time = true)::numeric
         / NULLIF(COUNT(*), 0)) * 100, 1
      )
      FROM traveler_ratings WHERE traveler_id = NEW.traveler_id
    ),
    updated_at = now()
  WHERE id = NEW.traveler_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_traveler_rating_stats
  AFTER INSERT ON traveler_ratings
  FOR EACH ROW EXECUTE FUNCTION update_traveler_rating_stats();

-- RLS traveler_ratings
CREATE POLICY "Shoppers can rate their completed packages"
  ON traveler_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM packages
      WHERE id = package_id AND user_id = auth.uid() AND status = 'completed'
    )
  );

CREATE POLICY "Shoppers can view own ratings"
  ON traveler_ratings FOR SELECT
  USING (auth.uid() = shopper_id);

CREATE POLICY "Admins can view all ratings"
  ON traveler_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

-- RLS platform_reviews
CREATE POLICY "Shoppers can review after rating traveler"
  ON platform_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = shopper_id
    AND EXISTS (
      SELECT 1 FROM traveler_ratings tr
      WHERE tr.package_id = platform_reviews.package_id
        AND tr.shopper_id = auth.uid()
    )
  );

CREATE POLICY "Shoppers can view own reviews"
  ON platform_reviews FOR SELECT
  USING (auth.uid() = shopper_id);

CREATE POLICY "Admins can view all reviews"
  ON platform_reviews FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ));

CREATE POLICY "Public can view consented reviews"
  ON platform_reviews FOR SELECT
  USING (consent_to_publish = true);
```

Logica frontend para auto-calculo en TravelerRatingModal:
```typescript
// Confirmo recepcion ANTES del viaje?
const confirmation = pkg.traveler_confirmation as any;
const confirmedAt = confirmation?.confirmedAt || confirmation?.confirmed_at;
const tripArrivalDate = trip?.arrival_date;
const travelerConfirmed = !!(confirmedAt && tripArrivalDate
  && new Date(confirmedAt) < new Date(tripArrivalDate));

// Entrego a tiempo en oficina?
const officeDelivery = pkg.office_delivery as any;
const declaredAt = officeDelivery?.traveler_declaration?.declared_at;
const tripDeliveryDate = trip?.delivery_date;
const deliveredOnTime = !!(declaredAt && tripDeliveryDate
  && new Date(declaredAt) <= new Date(tripDeliveryDate));
```

Logica en ShopperPackagePriorityActions para el flujo secuencial:
```typescript
const { data: travelerRating } = useQuery({
  queryKey: ['traveler-rating', pkg.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('traveler_ratings')
      .select('rating, comment')
      .eq('package_id', pkg.id)
      .maybeSingle();
    return data;
  },
  enabled: pkg.status === 'completed'
});

const { data: platformReview } = useQuery({
  queryKey: ['platform-review', pkg.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('platform_reviews')
      .select('rating')
      .eq('package_id', pkg.id)
      .maybeSingle();
    return data;
  },
  enabled: pkg.status === 'completed' && !!travelerRating
});

// Mostrar boton apropiado:
// !travelerRating -> "Calificar viajero"
// travelerRating && !platformReview -> "Calificar experiencia"
// ambos -> mostrar estrellas (solo lectura)
```

