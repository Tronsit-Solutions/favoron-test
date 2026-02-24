

## Agregar funcionalidad de editar inversiones de marketing

### Problema
Actualmente solo se puede agregar y eliminar inversiones. No hay forma de editar una inversion existente (cambiar monto, canal, mes o notas).

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCACAnalytics.tsx` | Agregar mutation `updateInvestment` que haga UPDATE en `marketing_investments` |
| `src/components/admin/cac/InvestmentForm.tsx` | Agregar boton de editar (icono lapiz) en cada fila, reutilizar el dialog existente en modo edicion |
| `src/components/admin/cac/CACAnalysisTab.tsx` | Pasar `onUpdateInvestment` y el estado de loading al `InvestmentForm` |

### Detalle tecnico

**`src/hooks/useCACAnalytics.tsx`**:
- Nueva mutation `updateInvestment` similar a `addInvestment` pero usando `.update()` con `.eq('id', id)`
- Exportar en el return del hook

**`src/components/admin/cac/InvestmentForm.tsx`**:
- Agregar prop `onUpdateInvestment(id, data)`
- Agregar estado `editingInvestment` para saber si el dialog esta en modo crear o editar
- Agregar icono de lapiz (Pencil) en cada fila junto al boton de eliminar
- Al hacer click en editar, abrir el mismo dialog pre-llenado con los datos existentes
- Al guardar, llamar `onUpdateInvestment` en vez de `onAddInvestment` si estamos editando

**`src/components/admin/cac/CACAnalysisTab.tsx`**:
- Conectar `updateInvestment` del hook con el nuevo prop del formulario

