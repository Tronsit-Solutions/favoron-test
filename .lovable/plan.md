

## Fix: Eliminar highlight celeste de `pending_office_confirmation`

**Problema**: En `src/components/Dashboard.tsx` línea 798, `hasPendingAction` todavía incluye `pending_office_confirmation`, lo que causa el borde/fondo celeste.

### Cambio

**`src/components/Dashboard.tsx` (línea 798)**:
- Cambiar `['matched', 'pending_office_confirmation'].includes(pkg.status)` → `pkg.status === 'matched'`

Esto eliminará el highlight celeste (borde izquierdo azul, fondo `bg-primary/5`, ring `ring-primary/20`) para paquetes en estado `pending_office_confirmation`.

