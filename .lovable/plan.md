

## Agregar sección de créditos de referidos al Dashboard Financiero

Agregar una tarjeta de resumen de referidos en el `FinancialDashboard.tsx` que muestre el estado global de créditos de referidos en la plataforma.

### Datos a consultar

Consulta directa a la tabla `referrals` desde el componente:
- **Crédito pendiente total**: suma de `reward_amount` donde `status = 'completed'` y `reward_used = false` (lo que se le debe a referidores)
- **Descuentos pendientes**: suma de `referred_reward_amount` donde `referred_reward_used = false` y `referred_reward_amount > 0`
- **Total distribuido**: suma de `reward_amount` donde `reward_used = true`
- **Referidos completados** vs **pendientes**: conteos por status

### Cambios en `src/components/admin/FinancialDashboard.tsx`

1. Agregar `useEffect` + estado para fetch de datos de referrals (query a `referrals` table)
2. Agregar una nueva Card después del "Resumen del Período" (antes de FinancialTablesSection) con:
   - Icono `Gift` y título "Créditos de Referidos"
   - Grid de 4 columnas:
     - **Crédito por pagar** (referrer rewards pendientes) — en amarillo/amber
     - **Descuentos pendientes** (referred rewards no usados) — en amber
     - **Ya distribuido** (reward_used = true) — en green
     - **Referidos activos** (count completados / total)

Esto le da visibilidad al admin del pasivo (liability) que representan los créditos de referidos no utilizados.

