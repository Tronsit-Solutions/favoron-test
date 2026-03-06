

## Eliminar rectángulo gris redundante en `pending_office_confirmation`

**Problema**: Para el estado `pending_office_confirmation`, el bloque gris interno (`bg-muted/30 border rounded-lg`) en `TravelerPackagePriorityActions` repite información que ya muestra el `TravelerPackageStatusBadge` del card padre — es redundante.

### Cambio propuesto

**`src/components/dashboard/traveler/TravelerPackagePriorityActions.tsx`**:
- Para el estado `pending_office_confirmation`, no renderizar el contenedor gris con el mensaje de texto. Solo mostrar el botón "Ver dirección de oficina" directamente, sin wrapper `bg-muted/30`.
- Esto se logra haciendo un early return especial para `pending_office_confirmation` que renderice únicamente el botón inline (sin el rectángulo gris) y el `OfficeAddressModal`.

### Resultado
El paquete en estado `pending_office_confirmation` se verá más compacto: solo el botón de "Ver dirección de oficina" sin el bloque gris redundante que repite el estado.

