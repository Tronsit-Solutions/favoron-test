

## Fix: Allow boost code application without existing accumulator

### Problem
The `validate_boost_code` SQL function fails for percentage-based boost codes when no `trip_payment_accumulator` record exists yet. It tries to look up `accumulated_amount` and returns an error ("No hay tips acumulados para calcular el boost") if the record is missing or zero.

The traveler should be able to apply the code early — the actual boost amount can be calculated later when the accumulator is created/updated.

### Solution

Update the `validate_boost_code` SQL function to handle missing accumulators:

1. **For `fixed` boost codes**: No change needed — these already work without an accumulator.

2. **For `percentage` boost codes without accumulator**: Instead of rejecting, register the usage with `boost_amount = 0` (placeholder). The actual amount will be calculated later when `createOrUpdateTripPaymentAccumulator` runs (it already calls `applyPendingBoostCode`).

3. **Update the accumulator upsert**: In the SQL function, if no `trip_payment_accumulator` exists, **create one** with `accumulated_amount = 0` and the boost amount, so the boost_amount is persisted.

4. **Frontend**: Update the error toast in `BoostCodeInput.tsx` — when the RPC returns `boost_amount = 0` for a percentage code, show a message like "Código aplicado. El monto se calculará al entregar paquetes."

### SQL Migration Changes

```sql
-- In validate_boost_code function:
-- For percentage type, if no accumulator or accumulated = 0:
-- Instead of returning error, set _calculated_boost = 0 (will be recalculated later)

IF _accumulated IS NULL OR _accumulated <= 0 THEN
  _calculated_boost := 0;  -- Will be recalculated when packages are delivered
ELSE
  _calculated_boost := round(_accumulated * _boost_code.boost_value / 100, 2);
  IF _boost_code.max_boost_amount IS NOT NULL AND _calculated_boost > _boost_code.max_boost_amount THEN
    _calculated_boost := _boost_code.max_boost_amount;
  END IF;
END IF;

-- Upsert trip_payment_accumulator instead of just UPDATE:
INSERT INTO trip_payment_accumulator (trip_id, traveler_id, accumulated_amount, boost_amount)
VALUES (_trip_id, _traveler_id, 0, _calculated_boost)
ON CONFLICT (trip_id, traveler_id)
DO UPDATE SET boost_amount = _calculated_boost, updated_at = now();
```

### Frontend Change

In `BoostCodeInput.tsx`: When `result.boost_amount === 0` and `result.valid === true`, show a success state with message "Código aplicado — el boost se calculará al entregar paquetes."

### Recalculation on Delivery

The existing `applyPendingBoostCode` in `useCreateTripPaymentAccumulator.tsx` already re-applies boost codes when the accumulator updates. Additionally, the `recalculate-trip-accumulator` edge function should recalculate percentage boosts when `accumulated_amount` changes and a usage record exists.

### Files
| File | Change |
|---|---|
| New SQL migration | Update `validate_boost_code` to allow percentage codes without accumulator; upsert accumulator |
| `src/components/traveler/BoostCodeInput.tsx` | Handle `boost_amount = 0` success case with appropriate messaging |
| `src/hooks/useCreateTripPaymentAccumulator.tsx` | Ensure recalculation of percentage boost when accumulator updates and usage exists |

