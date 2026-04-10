

## Aplicar BOOST_01 (6%) a las 2 órdenes de pago pendientes de Anika Erichsen

### Datos

| Orden | Trip | Monto actual | Boost (6%) | Nuevo monto |
|-------|------|-------------|------------|-------------|
| `e4f90468` | `f93c75c9` | Q380.00 | Q22.80 | Q402.80 |
| `b85e2167` | `278dbf7f` | Q485.00 | Q29.10 | Q514.10 |

- **Traveler ID**: `42ff1de3-2156-4636-99b5-ef9bc197e81f`
- **Boost Code ID**: `35582cad-c6fe-412d-9778-66839baf9a3e`

### Acciones (datos, no esquema)

1. **INSERT en `boost_code_usage`** -- 2 registros vinculando BOOST_01 a ambos viajes
2. **UPDATE en `trip_payment_accumulator`** -- `boost_amount` a Q22.80 y Q29.10
3. **UPDATE en `payment_orders`** -- `amount` a Q402.80 y Q514.10

### SQL a ejecutar (insert tool, no migración)

```sql
-- 1. Registrar uso del boost
INSERT INTO boost_code_usage (boost_code_id, traveler_id, trip_id, boost_amount)
VALUES
  ('35582cad-c6fe-412d-9778-66839baf9a3e', '42ff1de3-2156-4636-99b5-ef9bc197e81f', 'f93c75c9-d4ed-4107-b199-f4c18738597d', 22.80),
  ('35582cad-c6fe-412d-9778-66839baf9a3e', '42ff1de3-2156-4636-99b5-ef9bc197e81f', '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e', 29.10);

-- 2. Actualizar acumuladores
UPDATE trip_payment_accumulator SET boost_amount = 22.80 WHERE trip_id = 'f93c75c9-d4ed-4107-b199-f4c18738597d';
UPDATE trip_payment_accumulator SET boost_amount = 29.10 WHERE trip_id = '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e';

-- 3. Actualizar órdenes de pago
UPDATE payment_orders SET amount = 402.80, updated_at = now() WHERE id = 'e4f90468-8b70-4b5d-b7ee-cb990394c1d7';
UPDATE payment_orders SET amount = 514.10, updated_at = now() WHERE id = 'b85e2167-7816-492a-9ae3-c46c20673cca';
```

