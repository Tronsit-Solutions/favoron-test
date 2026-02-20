

## Corregir paquete archivado que fue completado

### Hallazgo

De los 113 paquetes con status `archived_by_shopper`, solo **1** tiene etiqueta asignada (`label_number`), lo que indica que fue procesado y deberia estar en status `completed`:

| ID | Label | feedback_completed |
|----|-------|--------------------|
| `6020dc3a-e0b2-4893-bfef-4fb432fb9e14` | 329 | true |

### Cambio

Una sola sentencia SQL para corregir el status:

```text
UPDATE packages 
SET status = 'completed'
WHERE status = 'archived_by_shopper' 
  AND label_number IS NOT NULL;
```

### Detalles tecnicos

- Afecta unicamente 1 registro
- Solo cambia el campo `status` de `archived_by_shopper` a `completed`
- `feedback_completed` ya esta en `true`, asi que no reaparecera en el dashboard del shopper
- No requiere cambios en codigo frontend ni migracion de esquema

