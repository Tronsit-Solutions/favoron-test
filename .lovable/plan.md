

## Plan: Rediseñar PartialDeliveryInfo para igualar el estilo de QuoteDialog

### Cambio

**Archivo: `src/components/dashboard/PartialDeliveryInfo.tsx`**

Reescribir el componente para usar el mismo layout inline con iconos que tiene la Card 2 del QuoteDialog (líneas 1190-1285):

- **Ventana de recepción**: `Clock` icon + texto inline `"Ventana de recepción: DD/MM/YYYY - DD/MM/YYYY"` en una sola línea (estilo `text-slate-600` label, `font-medium text-slate-800` valor).
- **Fecha de entrega**: `Calendar` icon + `"Fecha de entrega: DD/MM/YYYY"` con cálculo de +2 días hábiles.
- **Ciudad**: `Home` icon + ciudad del viajero.
- **Dirección**: `MapPin` icon + dirección línea 1.
- **Dirección 2**: `MapPin` icon (opacity-50) + texto con `blur-[4px] select-none text-slate-400`.
- **Código postal**: `MapPin` icon + código postal si existe.
- Mantener el alert informativo de "Información parcial" al inicio (estilo amber como en QuoteDialog).
- Eliminar los bloques `bg-muted/30` con headers separados.
- Importar `Clock`, `Home` además de los iconos actuales.

### Resultado
El componente en los modales de pago (`QuotePaymentStep`, `ShopperPaymentInfoModal`) y en `CollapsiblePackageCard` se verá idéntico al card del viajero en QuoteDialog.

