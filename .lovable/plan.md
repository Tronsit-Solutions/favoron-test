
## Fix: modal de tips se queda en “Guardando…” y luego falla

### Diagnóstico
No parece que el problema sea el cálculo del tip en sí. Para el paquete `882e2eb5...` ya quedó guardado en DB:
- `packages.admin_assigned_tip = 250`
- `products_data` ya tiene `adminAssignedTip` por producto
- `quote` ya quedó actualizado

Pero al mismo tiempo:
- no existen `package_assignments` todavía para ese paquete
- el error aparece dentro del flujo de **match**, antes de confirmar el match final
- en `AdminMatchDialog`, el callback `handleProductTipSave` solo actualiza estado local, pero `ProductTipAssignmentModal` está haciendo **persistencia real a DB antes de llamar ese callback**

Eso genera dos problemas:
1. El modal de tips está haciendo una operación pesada e innecesaria durante el pre-match.
2. Si esa persistencia tarda o vence el timeout, el usuario ve error aunque el paquete sí quedó actualizado parcialmente, y el estado local del match puede quedar desincronizado.

### Causa raíz
`ProductTipAssignmentModal` se reutiliza en 3 contextos distintos, pero hoy siempre hace lo mismo:
- guarda en `packages`
- sincroniza `package_assignments`
- actualiza `quote`
- luego recién ejecuta `onSave`

Eso sí tiene sentido en edición/admin post-match, pero **no** en `AdminMatchDialog`, donde solo debería guardar los tips “en borrador” para usarlos al presionar el botón principal de match.

### Plan de implementación

### 1. Separar “guardar local” vs “persistir”
En `src/components/admin/ProductTipAssignmentModal.tsx`:
- agregar un prop tipo `persistOnSave?: boolean` o `mode: "draft" | "persist"`
- si está en modo `draft`, el modal:
  - valida los tips
  - construye `productsWithTips`
  - llama `onSave(productsWithTips, totalTip)`
  - cierra modal
  - no llama `saveProductTips`

### 2. Usar modo draft dentro de AdminMatchDialog
En `src/components/admin/AdminMatchDialog.tsx`:
- pasar `persistOnSave={false}` al `ProductTipAssignmentModal`
- mantener `handleProductTipSave` solo como actualización de estado local:
  - `assignedProductsWithTips`
  - `adminTip`

Resultado: al dar guardar en tips, el admin vuelve instantáneamente al modal de match sin pegarle todavía a la DB.

### 3. Mantener persistencia real solo donde sí corresponde
Dejar `persistOnSave=true` (default) en:
- `src/components/admin/AdminActionsModal.tsx`
- `src/components/admin/QuoteEditModal.tsx`

Ahí sí tiene sentido guardar inmediatamente porque esos flujos sí son edición real del paquete/cotización.

### 4. Ajustar copy del botón para evitar confusión
En `ProductTipAssignmentModal.tsx`:
- en modo `draft`, cambiar el CTA de `Confirmar Match` a algo como:
  - `Aplicar tips`
  - o `Guardar tips para el match`
- en modo persistente, dejar un label acorde a edición/guardado

Esto evita que el modal de tips parezca el paso final del match.

### 5. Mantener timeout solo en flujos persistentes
El timeout de 15s debe seguir existiendo para edición real, pero no debería afectar el flujo draft del match, porque en ese caso no habrá llamada a DB desde el modal.

## Archivos a tocar
- `src/components/admin/ProductTipAssignmentModal.tsx`
- `src/components/admin/AdminMatchDialog.tsx`
- revisar props/usos en:
  - `src/components/admin/AdminActionsModal.tsx`
  - `src/components/admin/QuoteEditModal.tsx`

## Resultado esperado
- Al asignar tips por producto dentro de “Hacer Match”, ya no se quedará en `Guardando...`
- El modal cerrará rápido y cargará los tips al flujo de match
- La persistencia real ocurrirá al confirmar el match
- Se elimina el estado inconsistente donde DB sí cambia pero la UI muestra error

## Detalle técnico
```text
Flujo actual:
ProductTipAssignmentModal
-> saveProductTips() a DB
-> timeout/error posible
-> onSave() local

Flujo propuesto para match:
ProductTipAssignmentModal (draft)
-> validar
-> onSave() local
-> cerrar modal

Persistencia real:
AdminMatchDialog.handleMatch()
-> handleMatchPackage()
-> update package + package_assignments
```
