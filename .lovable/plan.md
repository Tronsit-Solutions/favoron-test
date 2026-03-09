

## Permitir al viajero ver documentos subidos en la pestaña Docs

### Problema

La pestaña "Docs" del viajero muestra los documentos (Comprobante de Compra, Información de Seguimiento) pero el botón "Ver Documento" no aparece o no funciona porque `purchase_confirmation` puede ser un array (múltiples archivos) y el código lo trata como objeto individual (`pkg.purchase_confirmation.filePath`).

### Cambio

**`src/components/dashboard/CollapsibleTravelerPackageCard.tsx`** - En ambas versiones del tab "docs" (mobile ~línea 580 y desktop ~línea 718):

1. Usar `normalizeConfirmations()` para convertir `purchase_confirmation` en array
2. Renderizar cada confirmación individualmente con su botón "Ver Documento" funcional
3. Mantener el viewer de tracking info igual (ya funciona correctamente)

Cambios específicos:
- Importar `normalizeConfirmations` de `@/utils/confirmationHelpers`
- Reemplazar el bloque de comprobante de compra (single object) por un `.map()` sobre el array normalizado
- Cada item tendrá botón para generar signed URL y abrir el modal de visualización

