

## Fix: Paquetes confirmados no aparecen en Preparación sin hard refresh

### Causa raíz
En `OperationsReceptionTab`, al confirmar un paquete se llama `onRemovePackage(id)` que **elimina** el paquete de `allPackages`. Pero el RPC `admin_confirm_office_delivery` cambia el status a `delivered_to_office`, que es el filtro de la pestaña Preparación (`readyPackages`).

Al eliminarlo del estado local, el paquete desaparece de Recepción pero nunca aparece en Preparación hasta hacer refresh.

### Solución
En vez de `removePackage`, usar `updatePackageStatus` para cambiar el status local a `delivered_to_office`. Así el paquete sale del filtro de Recepción y entra al de Preparación automáticamente.

### Cambios

**1. `src/pages/Operations.tsx`**
- Pasar `onUpdatePackageStatus={operationsData.updatePackageStatus}` a `OperationsReceptionTab`

**2. `src/components/operations/OperationsReceptionTab.tsx`**
- Agregar prop `onUpdatePackageStatus: (id: string, status: string) => void`
- En `handleConfirmPackage`: reemplazar `onRemovePackage(packageId)` → `onUpdatePackageStatus(packageId, 'delivered_to_office')`
- En `handleConfirmAll`: reemplazar `onRemovePackages(confirmed)` → iterar `confirmed.forEach(id => onUpdatePackageStatus(id, 'delivered_to_office'))`

### Resultado
Al confirmar recepción, el paquete se mueve instantáneamente a la pestaña Preparación sin necesidad de refresh.

