

## Tip Booster para Viajeros

### Concepto
Códigos de boost que aumentan el pago del viajero en un viaje completo. Favoron absorbe el costo. Tanto admin como viajero pueden aplicar el código. El boost se aplica **sobre el tip acumulado del viaje**, no por paquete individual.

### Tipos de boost
- **Fijo**: Suma un monto fijo al tip acumulado (ej: +Q20)
- **Porcentual**: Suma un % del tip acumulado (ej: 5% sobre Q500 = +Q25, total Q525)
- **`max_boost_amount`**: Tope máximo para boosts porcentuales (ej: máximo Q50)

```text
Ejemplo porcentual:
  Tip acumulado del viaje: Q500
  Boost: 5%
  Boost calculado: Q25
  Viajero recibe: Q525
  Favoron absorbe: Q25 menos de service fee

Ejemplo fijo:
  Tip acumulado del viaje: Q500
  Boost: Q20 fijo
  Viajero recibe: Q520
  Favoron absorbe: Q20 menos de service fee
```

### Cambios en base de datos

1. **Tabla `boost_codes`**:
   - `id`, `code` (unique), `description`, `boost_type` (enum: 'percentage' | 'fixed'), `boost_value` (numeric), `max_boost_amount` (nullable, para tope en porcentuales), `max_uses`, `single_use_per_user`, `expires_at`, `is_active`, `created_at`, `updated_at`
   - RLS: admin full CRUD

2. **Tabla `boost_code_usage`**:
   - `id`, `boost_code_id` (FK), `trip_id`, `traveler_id`, `boost_amount` (monto calculado final), `used_at`
   - RLS: admin full access, travelers SELECT own usage

3. **Columna `boost_amount`** en `trip_payment_accumulator` (numeric, default 0)

4. **RPC `validate_boost_code`**: recibe código + trip_id + traveler_id, valida (activo, no expirado, usos), calcula monto según tipo:
   - Si `fixed`: `boost_value`
   - Si `percentage`: `(accumulated_amount * boost_value / 100)`, capped por `max_boost_amount`
   - Registra en `boost_code_usage` y actualiza `trip_payment_accumulator.boost_amount`

### Cambios en frontend

5. **Página Admin `/admin/boost-codes`**: CRUD de boost codes (similar a AdminDiscounts). Campos: código, descripción, tipo (fijo/porcentual), valor, tope máximo, usos, expiración, activo.

6. **Aplicación por Admin**: En vista de detalle del viaje/pagos, campo para ingresar boost code → valida con RPC → muestra resultado.

7. **Aplicación por Viajero**: En dashboard de viajero (vista de viaje o pagos), campo para ingresar boost code → valida con RPC.

8. **Cálculo del acumulador**: Modificar `useCreateTripPaymentAccumulator` para incluir `boost_amount` en el total: `accumulated_amount = tips + boost_amount`.

9. **Dashboard Financiero**: Card "Tip Boosts" y columna en `FinancialSummaryTable` restando del ingreso de Favoron.

### Archivos a crear/modificar
- Nueva migración SQL (tablas, RLS, RPC, columna en accumulator)
- `src/pages/AdminBoostCodes.tsx` (nueva)
- `src/hooks/useCreateTripPaymentAccumulator.tsx`
- `src/hooks/useTripPayments.tsx`
- `src/components/admin/FinancialDashboard.tsx`
- `src/components/admin/FinancialSummaryTable.tsx`
- Componente input boost code para viajero y admin
- Routing y navegación

