

## Diagnóstico

**Confirmado en DB**: No existe ningún `package_assignment` para `b4df2001`, y el paquete sigue en `status: approved` con `matched_trip_id: null`. El match **no se guardó**.

### Causa raíz

El cambio optimista anterior tiene un defecto: el toast "¡Match exitoso!" se muestra **antes** de que el RPC se ejecute. Si el RPC falla, el `.catch()` hace rollback del estado local y muestra un toast de error — pero el usuario ya vio el toast de éxito y probablemente no notó el de error.

Además, **no existe código para cambiar automáticamente a la pestaña "matches"** después de un match exitoso.

### Plan de cambios

**Archivo: `src/components/AdminDashboard.tsx`** — función `handleMatch`:

1. **Restaurar el `await` del RPC antes del toast**: El modal ya se cierra inmediatamente (línea 258) dando feedback instantáneo. El toast debe aparecer solo después de confirmar que el RPC funcionó. Esto es seguro porque el modal ya cerró — el usuario no queda bloqueado.

2. **Agregar navegación automática a la pestaña "matches"**: Después de un match exitoso, cambiar `activeTab` a `"matching"` y `matchingTab` a `"active"` para que el usuario vea el paquete en la sección de matches.

3. **Mantener el rollback**: Si el RPC falla, revertir el estado local y mostrar toast destructivo.

```text
Flujo propuesto:
1. Click confirmar → modal se cierra inmediatamente ✅ (ya funciona)
2. matchingPackageIds oculta paquete de Solicitudes ✅ (ya funciona)  
3. await RPC → si éxito:
   - Actualizar localPackages con status 'matched'
   - Toast "¡Match exitoso!"
   - setActiveTab("matching") → navegar a pestaña matches
4. Si falla → toast de error, NO rollback necesario (nunca se cambió el estado)
```

### Archivos a modificar
- `src/components/AdminDashboard.tsx` — reestructurar `handleMatch` para await RPC antes de toast y agregar cambio de pestaña

