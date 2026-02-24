

## Agregar segmentacion de audiencia a inversiones de marketing

### Problema
Actualmente las inversiones de marketing no distinguen si van dirigidas a captar shoppers, viajeros o ambos. Esto impide calcular un CAC preciso por tipo de usuario, ya que mezcla inversion de adquisicion de viajeros con la de shoppers.

### Solucion
Agregar un campo `target_audience` a la tabla `marketing_investments` y al formulario, con 3 opciones: **Shoppers**, **Viajeros**, **Ambos**. Esto permite despues filtrar la inversion relevante para calcular el CAC de shoppers de forma mas precisa.

### Cambios

| Archivo | Cambio |
|---------|--------|
| Base de datos | Agregar columna `target_audience` (text, default `'both'`) a `marketing_investments` |
| `src/hooks/useCACAnalytics.tsx` | Incluir `target_audience` en las queries y mutations. Calcular inversion filtrada por audiencia para CAC de shoppers |
| `src/components/admin/cac/InvestmentForm.tsx` | Agregar selector de audiencia en el formulario y columna en la tabla |
| `src/components/admin/cac/CACKPICards.tsx` | Mostrar CAC Shoppers separado usando solo inversion dirigida a shoppers |

### Detalle tecnico

**Migracion SQL**:
```sql
ALTER TABLE marketing_investments 
ADD COLUMN target_audience text NOT NULL DEFAULT 'both';
```
Valores validos: `'shoppers'`, `'travelers'`, `'both'`

**`useCACAnalytics.tsx`**:
- Agregar `target_audience` al tipo `MarketingInvestment`
- En las mutations de add/update, incluir `target_audience`
- Calcular `shopperInvestment`: sumar inversiones donde `target_audience` es `'shoppers'` o la mitad cuando es `'both'`
- Exponer `shopperCAC` en GlobalKPIs: `shopperInvestment / monetizedUsers`

**`InvestmentForm.tsx`**:
- Agregar estado `targetAudience` con default `'both'`
- Agregar Select con opciones: Shoppers, Viajeros, Ambos
- Mostrar columna "Audiencia" en la tabla con badge de color
- Incluir `target_audience` en los handlers de submit y edit

**`CACKPICards.tsx`**:
- Renombrar CAC actual a "CAC Global"
- Agregar card "CAC Shoppers" que use solo la inversion atribuida a shoppers

### Logica de atribucion de inversion
- `target_audience = 'shoppers'`: 100% de la inversion cuenta para CAC shoppers
- `target_audience = 'travelers'`: 0% cuenta para CAC shoppers
- `target_audience = 'both'`: 50% cuenta para CAC shoppers (proporcional)

