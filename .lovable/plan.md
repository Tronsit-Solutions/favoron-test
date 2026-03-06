

## Cambiar trigger de encuesta a después de solicitar pago

Cambio simple en `TripCard.tsx`: modificar `shouldShowSurveyButton` para que requiera `payment_order_created === true` en lugar de solo `all_packages_delivered`.

### Cambio en `src/components/dashboard/TripCard.tsx`

Líneas 103-106: cambiar la condición de:
```ts
const shouldShowSurveyButton = tripPayment?.all_packages_delivered && 
  !trip.traveler_feedback_completed && 
  currentUser?.id === trip.user_id;
```

A:
```ts
const shouldShowSurveyButton = tripPayment?.all_packages_delivered && 
  tripPayment?.payment_order_created &&
  !trip.traveler_feedback_completed && 
  currentUser?.id === trip.user_id;
```

Esto asegura que el botón "Califica tu experiencia" solo aparece después de que el viajero haya solicitado su pago, cuando ya terminó su proceso operativo.

