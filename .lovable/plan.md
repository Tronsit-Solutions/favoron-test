

## Aplicar BOOST_01 (6%) a las 2 órdenes de pago de Cecilia Prahl

### Datos actuales

| Orden | Trip | Monto actual | Boost | Nuevo monto |
|-------|------|-------------|-------|-------------|
| `cdde845e` | `0dff3d19` | Q400.00 | Q24.00 (6%) | Q424.00 |
| `76b2f50a` | `bcd58f84` | Q240.00 | Q14.40 (6%) | Q254.40 |

### Acciones (datos, no esquema)

1. **Crear registros en `boost_code_usage`** para ambos viajes con BOOST_01
2. **Actualizar `trip_payment_accumulator`** → `boost_amount` a Q24 y Q14.40
3. **Actualizar `payment_orders`** → `amount` a Q424 y Q254.40

### Detalle técnico

Se usará la herramienta de inserción/actualización de datos (no migración) para ejecutar 3 operaciones:
- INSERT en `boost_code_usage` (2 registros)
- UPDATE en `trip_payment_accumulator` (2 filas)
- UPDATE en `payment_orders` (2 filas)

