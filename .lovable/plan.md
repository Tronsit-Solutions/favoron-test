

## Solución: Mejorar el Flujo de Reintento de Pagos con Tarjeta

### Problema Raíz

El sistema crea un nuevo checkout de Recurrente cada vez que el usuario intenta pagar, sin verificar si existe uno previo. Esto puede causar:
- Confusión con múltiples checkouts para el mismo paquete
- Webhooks del checkout anterior que podrían llegar desordenados
- Links de pago que expiran o se invalidan

### Solución Propuesta

Modificar el flujo para limpiar el checkout anterior antes de crear uno nuevo, y agregar el monto al URL de callback para tracking.

---

### Cambios a Realizar

#### 1. Hook `useRecurrenteCheckout.tsx` (líneas 42-47)

Agregar el monto al URL de callback para Meta Pixel:

```typescript
success_url: `${window.location.origin}/payment-callback?payment=success&package_id=${packageId}&amount=${amount}`,
```

#### 2. Edge Function `create-recurrente-checkout/index.ts` (líneas 40-45)

Antes de crear el checkout, limpiar cualquier checkout_id previo para evitar confusiones:

```typescript
// Clear any previous checkout to avoid webhook conflicts
await supabase
  .from('packages')
  .update({ recurrente_checkout_id: null })
  .eq('id', package_id);
```

#### 3. Agregar validación de respuesta en el edge function

Mejorar el manejo de errores para detectar cuando Recurrente rechaza la creación:

```typescript
if (!recurrenteResponse.ok) {
  // Log specific error for debugging
  console.error('Recurrente rejection:', {
    status: recurrenteResponse.status,
    body: recurrenteData
  });
}
```

---

### Resultado Esperado

1. Al reintentar un pago, se limpia el checkout anterior
2. Se crea un nuevo checkout limpio sin conflictos
3. El webhook solo necesita procesar el checkout activo
4. Mejor tracking del monto en Meta Pixel para conversiones

