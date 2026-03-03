

## Plan: Permitir al shopper cambiar método de entrega al responder cotización

### Problema
Actualmente el shopper no puede cambiar su método de entrega (delivery vs pickup) al ver la cotización. Si eligió delivery y ya no lo quiere (o viceversa), no tiene forma de modificarlo.

### Cambios

#### 1. `src/components/QuoteDialog.tsx`
- Agregar estado local `selectedDeliveryMethod` inicializado con `packageDetails.delivery_method`.
- En la sección de precios (donde se muestra "Entrega a domicilio"), agregar un toggle/switch o botones para que el shopper pueda cambiar entre "Recoger en punto" y "Entrega a domicilio".
- Solo mostrar este toggle cuando `isShopperViewingQuote` (no para viajeros ni admin).
- Todos los cálculos de precios que usan `packageDetails.delivery_method` deben usar `selectedDeliveryMethod` en su lugar para recalcular en tiempo real.
- Al hacer submit (`handleSubmit`), incluir `deliveryMethodChange: selectedDeliveryMethod` en `submitData` si cambió respecto al original.

#### 2. `src/hooks/useDashboardActions.tsx`
- En el flujo de aceptación de cotización del shopper (`message === 'accepted'`), verificar si `quoteData.deliveryMethodChange` existe.
- Si hay cambio, actualizar `delivery_method` en el paquete junto con la aceptación.
- Recalcular el quote con el nuevo delivery method antes de guardarlo.

### UI propuesta
Dentro del card de precios del shopper, debajo de la línea de "Entrega a domicilio" o del total, un bloque tipo:

```
┌─────────────────────────────────────┐
│ 🚚 Método de entrega               │
│ ○ Recoger en punto de entrega      │
│ ● Entrega a domicilio    Q45.00    │
└─────────────────────────────────────┘
```

Con radio buttons que recalculen el total inmediatamente. Si el shopper no tiene dirección confirmada y selecciona delivery, se mostraría una nota indicando que deberá confirmar dirección después.

### Archivos a modificar
1. **`src/components/QuoteDialog.tsx`** — toggle de delivery method + recálculo de precios en tiempo real.
2. **`src/hooks/useDashboardActions.tsx`** — persistir el cambio de delivery_method al aceptar la cotización.

