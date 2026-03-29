

## Mejoras al botón "Descartar": confirmación + animación sin reload

### Problema actual
1. No hay diálogo de confirmación antes de descartar
2. Se hace `window.location.reload()` — recarga toda la página

### Cambios

**Archivo: `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`**

1. **Agregar estado para diálogo de confirmación**
   - Nuevo estado `showDismissConfirm` (boolean)
   - Los 3 botones "Descartar" ahora abren el diálogo en vez de ejecutar directamente

2. **Agregar diálogo de confirmación**
   - Usar `AlertDialog` (ya disponible en el proyecto) con mensaje: "¿Estás seguro de que quieres descartar este paquete?"
   - Botón "Cancelar" y botón "Descartar" (destructive)

3. **Eliminar `window.location.reload()`** y reemplazar con:
   - Nuevo estado `dismissed` (boolean)
   - Tras éxito del update en Supabase, setear `dismissed = true`
   - Al inicio del componente: `if (dismissed) return null` — el card desaparece sin recargar
   - Opcionalmente agregar callback `onDismissExpiredPackage` (ya existe en props) para notificar al padre

### Detalle técnico

```tsx
// Nuevos estados
const [showDismissConfirm, setShowDismissConfirm] = useState(false);
const [dismissed, setDismissed] = useState(false);

// Early return
if (dismissed) return null;

// handleDismissAssignment modificado
const handleDismissAssignment = async () => {
  // ... mismo código de supabase update ...
  // Reemplazar window.location.reload() con:
  setDismissed(true);
  onDismissExpiredPackage?.(pkg.id);
};

// Botones cambian a: onClick={() => setShowDismissConfirm(true)}

// AlertDialog al final del componente
<AlertDialog open={showDismissConfirm} onOpenChange={setShowDismissConfirm}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Descartar este paquete?</AlertDialogTitle>
      <AlertDialogDescription>
        Ya no verás este pedido en tu dashboard. Esta acción no se puede deshacer.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDismissAssignment} variant destructive>
        Descartar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Archivo
- `src/components/dashboard/CollapsibleTravelerPackageCard.tsx`

