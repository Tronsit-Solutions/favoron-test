
## Ocultar Rechazos de Viajero a Shoppers

### Problema
El componente `CollapsiblePackageCard.tsx` muestra el `RejectionReasonDisplay` a los shoppers siempre que existe `rejection_reason`, sin distinguir entre:
- **Rechazos de admin**: Cuando un pedido no cumple reglas y el status es `rejected` - esto SI debe mostrarse
- **Rechazos de viajero**: Cuando un viajero rechaza la asignacion - esto NO debe mostrarse porque confunde al shopper

### Solucion

Modificar la condicion en la linea 931-933 de `CollapsiblePackageCard.tsx` para que solo muestre el motivo de rechazo cuando el status del paquete es `rejected` (rechazo administrativo).

### Cambio Tecnico

**Archivo: src/components/dashboard/CollapsiblePackageCard.tsx**

Cambiar de:
```tsx
{pkg.rejection_reason && <div className="mt-3">
    <RejectionReasonDisplay rejectionReason={pkg.rejection_reason as any} />
</div>}
```

A:
```tsx
{pkg.status === 'rejected' && pkg.rejection_reason && <div className="mt-3">
    <RejectionReasonDisplay rejectionReason={pkg.rejection_reason as any} />
</div>}
```

### Resultado

- Shoppers solo veran el motivo de rechazo cuando su pedido fue rechazado por admin (status `rejected`)
- Los rechazos de viajeros (que quedan en status `approved` o similar para reasignacion) no se mostraran
- La informacion de rechazos de viajero sigue disponible para admins en el panel de administracion
