

## Agregar BoostCodeInput al TripTipsModal

### Contexto
El modal `TripTipsModal` ya muestra información del boost si existe (`trip.boost_code`), pero no tiene un input para que el viajero ingrese un código de boost. El componente `BoostCodeInput` ya existe y funciona.

### Cambio

**Archivo: `src/components/dashboard/TripTipsModal.tsx`**

Agregar el componente `BoostCodeInput` entre la sección de "Paquetes asignados" y la sección de "Action" (antes de línea 357), visible solo cuando:
- No hay boost ya aplicado (`!boostInfo || boostInfo.amount <= 0`)
- No se ha solicitado cobro aún (`!paymentAlreadyRequested`)

Al aplicar un boost exitosamente, actualizar `boostInfo` con el nuevo monto para que se refleje inmediatamente en el total.

```tsx
import BoostCodeInput from '@/components/traveler/BoostCodeInput';

// Entre paquetes y botón de cobro:
{!paymentAlreadyRequested && (!boostInfo || boostInfo.amount <= 0) && (
  <BoostCodeInput
    tripId={trip.id}
    travelerId={currentUser?.id}
    existingBoost={boostInfo?.amount}
    onBoostApplied={(amount) => {
      setBoostInfo({ amount, type: '', value: 0, pending: false });
    }}
  />
)}
```

### Resultado
- El viajero puede ingresar un código de boost directamente desde el modal de tips
- Una vez aplicado, el boost se refleja en el desglose y el total a cobrar
- El input desaparece si ya hay un boost activo o si ya se solicitó cobro

