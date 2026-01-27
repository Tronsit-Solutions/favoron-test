

# Plan: Crear Payment Accumulator y Orden de Cobro para Daniela Ortiz-Miron

## Datos Identificados

### Viaje
| Campo | Valor |
|-------|-------|
| Trip ID | `4fb91dad-1df0-4ea7-97b2-60fc8ac9d270` |
| Traveler ID | `3c364aa5-172d-4f60-a106-9935a752fc6e` |
| Origen | Hamburgo, Alemania |
| Destino | Guatemala City |
| Llegada | 4 de enero 2026 |

### Paquetes Asignados
| ID | Descripción | Estado | Tip | Elegible |
|----|-------------|--------|-----|----------|
| `d1b27084-a4b8-444f-a39d-b00c261a3e8f` | 2 Protectores para caballos | `completed` | Q100.00 | Sí |
| `4f68c3df-234d-4d87-ba06-893437ddca5a` | Pantalón para Equitación | `quote_expired` | Q70.00 | No |

### Información Bancaria
| Campo | Valor |
|-------|-------|
| Banco | Banco Industrial |
| Titular | Daniela Ortiz |
| Cuenta | 8090013015 |
| Tipo | Monetaria |

---

## Paso 1: Crear Trip Payment Accumulator

Insertar registro en `trip_payment_accumulator`:

```sql
INSERT INTO trip_payment_accumulator (
  trip_id,
  traveler_id,
  accumulated_amount,
  delivered_packages_count,
  total_packages_count,
  all_packages_delivered,
  payment_order_created
) VALUES (
  '4fb91dad-1df0-4ea7-97b2-60fc8ac9d270',
  '3c364aa5-172d-4f60-a106-9935a752fc6e',
  100.00,  -- Solo el paquete completed cuenta
  1,       -- 1 paquete entregado
  1,       -- 1 paquete elegible (el otro está quote_expired)
  true,    -- Todos los elegibles entregados
  false    -- Aún no se crea la payment order
);
```

---

## Paso 2: Crear Payment Order

Insertar registro en `payment_orders`:

```sql
INSERT INTO payment_orders (
  trip_id,
  traveler_id,
  amount,
  bank_name,
  bank_account_holder,
  bank_account_number,
  bank_account_type,
  payment_type,
  status,
  historical_packages
) VALUES (
  '4fb91dad-1df0-4ea7-97b2-60fc8ac9d270',
  '3c364aa5-172d-4f60-a106-9935a752fc6e',
  100.00,
  'Banco Industrial',
  'Daniela Ortiz',
  '8090013015',
  'monetaria',
  'trip_payment',
  'pending',
  '[{"package_id": "d1b27084-a4b8-444f-a39d-b00c261a3e8f", "tip": 100.00, "description": "2 Protectores para caballos"}]'
);
```

---

## Paso 3: Actualizar Accumulator

Marcar que la payment order fue creada:

```sql
UPDATE trip_payment_accumulator
SET payment_order_created = true,
    updated_at = now()
WHERE trip_id = '4fb91dad-1df0-4ea7-97b2-60fc8ac9d270'
  AND traveler_id = '3c364aa5-172d-4f60-a106-9935a752fc6e';
```

---

## Resumen de Operaciones

| Tabla | Operación | Monto |
|-------|-----------|-------|
| `trip_payment_accumulator` | INSERT | Q100.00 acumulado |
| `payment_orders` | INSERT | Q100.00 a pagar |
| `trip_payment_accumulator` | UPDATE | `payment_order_created = true` |

---

## Resultado Esperado

Daniela Ortiz-Miron tendrá:
1. Un **payment accumulator** mostrando Q100.00 acumulados
2. Una **orden de cobro pendiente** por Q100.00 en el panel de administración
3. La orden aparecerá en la pestaña "Pagos a Viajeros" lista para ser procesada

