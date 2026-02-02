
# Plan: Actualizar Check Constraint para Métodos de Entrega

## Problema

La base de datos tiene un constraint que solo permite `pickup` y `delivery` como valores válidos para `delivery_method`. Los nuevos valores para devoluciones (`return_dropoff` y `return_pickup`) están bloqueados.

## Solución

Crear una migración SQL para actualizar el constraint.

## Archivo: Nueva migración SQL

Crear archivo en `supabase/migrations/` con nombre como `20260202_add_return_delivery_methods.sql`:

```sql
-- Drop the existing constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_delivery_method_check;

-- Add updated constraint with new return methods
ALTER TABLE packages ADD CONSTRAINT packages_delivery_method_check 
CHECK (delivery_method = ANY (ARRAY['pickup', 'delivery', 'return_dropoff', 'return_pickup']));
```

## Resultado

| Valor permitido | Descripción |
|-----------------|-------------|
| `pickup` | Recoger en oficina |
| `delivery` | Envío a domicilio |
| `return_dropoff` | Dejar en punto de devolución (UPS/FedEx) |
| `return_pickup` | Pickup programado por carrier |

## Impacto

- **Sin pérdida de datos**: Solo modifica el constraint, no los datos existentes
- **Retrocompatible**: Los valores existentes siguen siendo válidos
- **Inmediato**: Una vez aplicado, las nuevas solicitudes de devolución funcionarán
