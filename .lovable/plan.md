

## Encuesta de Satisfacción para Viajeros — Estructura de datos

Correcto, debe ser una tabla separada. Los shoppers tienen `traveler_ratings` (califican al viajero) y `platform_reviews` (califican a Favorón). La encuesta de viajeros es distinta: el viajero califica a Favorón desde su perspectiva.

### 1. Nueva tabla `traveler_surveys`

Tabla dedicada, separada de `platform_reviews` (que es de shoppers). Campos:

- `id`, `traveler_id`, `trip_id` (UNIQUE constraint en traveler_id + trip_id)
- `rating` (1-5 estrellas)
- `would_recommend` (boolean)
- `process_difficulty` (enum text: very_easy, easy, normal, difficult, very_difficult)
- `would_register_again` (enum text: yes_sure, probably_yes, not_sure, probably_no, no)
- `tip_satisfaction` (enum text: very_satisfied, satisfied, neutral, unsatisfied, very_unsatisfied)
- `review_text` (nullable)
- `consent_to_publish` (boolean, default false)
- `created_at`

RLS: viajeros insertan/ven las propias, admins ven todas, público ve las consentidas.

### 2. Nuevo campo `traveler_feedback_completed` en tabla `trips`

Equivalente al `feedback_completed` de packages. Se agrega como columna boolean default false en `trips`. Cuando el viajero completa o omite la encuesta, se marca true para ocultar el prompt.

### 3. Componente `TravelerSurveyModal.tsx`

Modal con las 6 preguntas definidas. Al submit: inserta en `traveler_surveys` y actualiza `trips.traveler_feedback_completed = true`.

### 4. Trigger en `TripCard.tsx`

Cuando `all_packages_delivered = true` y `trip.traveler_feedback_completed !== true`, mostrar botón "Califica tu experiencia" que abre el modal. Opción de "Omitir" que solo marca `traveler_feedback_completed = true`.

### 5. Admin: `AdminTravelerSurveysTab.tsx`

Nueva pestaña en AdminSurveys con KPIs (rating promedio, % recomendaría, distribución de dificultad, satisfacción con propina) y tabla detallada.

### Archivos:
- **Migración SQL**: crear `traveler_surveys` + agregar `traveler_feedback_completed` a `trips`
- **Crear**: `src/components/dashboard/TravelerSurveyModal.tsx`
- **Crear**: `src/components/admin/AdminTravelerSurveysTab.tsx`
- **Modificar**: `src/components/dashboard/TripCard.tsx` — trigger + modal
- **Modificar**: `src/pages/AdminSurveys.tsx` — nueva pestaña

