

## Plan: Agregar 'cancelled' al CHECK constraint de user_type

### Problema
La columna `user_type` en `customer_experience_calls` tiene un CHECK constraint que solo permite `'shopper'` y `'traveler'`. El hook `useCancelledPackages.ts` inserta `user_type: 'cancelled'`, lo cual PostgreSQL rechaza sin importar quién lo haga.

### Fix
Una migración SQL para actualizar el constraint:

```sql
ALTER TABLE customer_experience_calls 
DROP CONSTRAINT customer_experience_calls_user_type_check;

ALTER TABLE customer_experience_calls 
ADD CONSTRAINT customer_experience_calls_user_type_check 
CHECK (user_type = ANY (ARRAY['shopper','traveler','cancelled']));
```

Sin cambios de código — el hook ya envía el valor correcto, solo falta que la base de datos lo acepte.

