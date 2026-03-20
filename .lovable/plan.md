

## Eliminar 3 paquetes duplicados de Julián García

### Acción
Ejecutar DELETE en la tabla `packages` para los 3 IDs duplicados (todos `pending_approval`, sin match):

```sql
DELETE FROM packages WHERE id IN (
  '1b414357-a49f-41de-9371-560337dc6b8f',
  'e66c8b41-d8d9-44d1-b7ef-4bc676e635a2',
  '56340daf-cb99-4be9-9a9e-624931f28ad0'
);
```

### Se conserva
- `6c7615f3` — Whoop Peak, status `matched` (el pedido real)

### Técnico
- Solo requiere una operación DELETE via el insert tool
- No hay foreign keys en cascada que afecten otras tablas para estos paquetes (no tienen mensajes, assignments, ni pagos asociados al ser `pending_approval`)
- No se modifica código

