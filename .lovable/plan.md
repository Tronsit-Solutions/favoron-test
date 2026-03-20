

## Fix: User ID truncado en modal de perfil

### Problema
El campo User ID en `UserDetailModal` muestra solo "4" en vez del UUID completo. La clase `truncate` en el `<code>` corta el texto, y el contenedor no tiene suficiente ancho.

### Solución — `src/components/admin/UserDetailModal.tsx` (línea 67)

Cambiar el `<code>` para que el UUID sea visible completo:
- Reemplazar `truncate` por `break-all` para que el UUID se muestre en múltiples líneas si es necesario
- Alternativamente, usar `overflow-x-auto` para scroll horizontal

```tsx
// Antes:
<code className="text-xs font-mono bg-muted px-2 py-1 rounded select-all flex-1 truncate">{userId}</code>

// Después:
<code className="text-xs font-mono bg-muted px-2 py-1 rounded select-all flex-1 break-all">{userId}</code>
```

Un solo cambio de clase CSS en una línea.

