

## Plan: Hacer el proceso de matching fail-proof

### Problemas identificados

1. **Fallo silencioso en AdminDashboard**: Línea 169 — si `selectedPackage` es null o `tripIds` está vacío, el `return` es silencioso. El dialog ya cerró en AdminMatchDialog y el admin no sabe qué pasó.

2. **El dialog se cierra antes de saber si el match funcionó**: AdminDashboard cierra el modal (líneas 184-186) ANTES de llamar al RPC. Si falla, el admin ya perdió contexto.

3. **El catch en AdminDashboard no muestra error**: Línea 204-206 solo hace `console.error`, el admin no ve nada.

4. **Toast "Procesando" desaparece solo**: Usa `toast.info` que auto-cierra en ~4s sin importar el resultado.

5. **Dos sistemas de toast en conflicto**: AdminDashboard usa `useToast` (legacy), AdminMatchDialog usa `sonner`. Los mensajes pueden no ser visibles o aparecer en lugares distintos.

6. **El tipo de `onMatch` es `void`**: El dialog no puede awaitar el resultado real del RPC.

### Solución

**Archivo 1: `src/components/admin/AdminMatchDialog.tsx`**

- Cambiar tipo de `onMatch` de `void` a `Promise<void>`
- Reemplazar `toast.info` por `toast.loading()` que persiste hasta ser reemplazado
- En el `try`: awaitar `onMatch`, luego reemplazar con `toast.success("¡Match confirmado!")`
- En el `catch`: reemplazar con `toast.error("Error al confirmar match")`
- Mantener el dialog abierto durante el proceso (ya lo hace con `isSubmittingMatch`)

```typescript
const toastId = toast.loading("Procesando asignación...", {
  description: "Confirmando el match con el viajero seleccionado."
});
try {
  await onMatch(...);
  toast.success("¡Match confirmado!", { id: toastId, description: "Paquete asignado exitosamente." });
} catch (err) {
  toast.error("Error al confirmar match", { id: toastId, description: err?.message || "Intenta de nuevo." });
} finally {
  setIsSubmittingMatch(false);
}
```

**Archivo 2: `src/components/AdminDashboard.tsx`**

- Línea 169: Reemplazar `return` silencioso con `throw new Error("No se encontró el paquete o viajeros seleccionados")` para que el dialog lo capture
- Mover el cierre del modal (líneas 184-186) DESPUÉS del `await onMatchPackage` exitoso
- Eliminar el toast legacy de éxito (líneas 196-203) — el feedback ahora lo maneja el dialog con sonner
- Agregar `toast.error` con sonner en el `catch` (línea 204) como respaldo

**Resultado**: El admin siempre ve feedback claro — un spinner persistente mientras procesa, éxito verde o error rojo al terminar. No hay más fallos silenciosos ni toasts que desaparecen prematuramente.

