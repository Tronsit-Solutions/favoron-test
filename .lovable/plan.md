

## Plan: Corregir quote de la asignación bid_submitted del paquete de Rodrigo Noguera

### Problema
La asignación `62a359cb` (status `bid_submitted`) tiene `admin_assigned_tip = 275` pero la quote interna sigue con valores de cuando el tip era Q200:
- price: 200 → debería ser **275**
- serviceFee: 100 (50% de 200) → debería ser **137.50** (50% de 275, trust_level basic)
- totalPrice: 300 → debería ser **412.50**

### Solución
Una migración SQL que actualice el campo JSONB `quote` en la asignación `62a359cb`:

```sql
UPDATE package_assignments
SET quote = jsonb_set(
  jsonb_set(
    jsonb_set(quote::jsonb, '{price}', '"275"'),
    '{serviceFee}', '"137.50"'
  ),
  '{totalPrice}', '"412.50"'
),
updated_at = now()
WHERE id = '62a359cb-c757-481e-88f9-0a63af7224dd';
```

### Nota preventiva
En el futuro, cuando se actualice `admin_assigned_tip` en asignaciones que ya tienen quote (bid_submitted), la quote debería recalcularse automáticamente. Esto podría abordarse en un paso posterior si se desea.

