

## Fix: Corregir deliveryFee de Q60 a Q45 en dos paquetes de marzo

### Problema
Ambos paquetes tienen `cityArea: "Mixco"`, que corresponde a la zona `guatemala_department` (Q45). Sin embargo, el campo `deliveryFee` en el quote JSON quedó en Q60 (tarifa "outside"). No hay `package_assignments` activas para estos paquetes, así que solo hay que corregir la tabla `packages`.

### Dato interesante
Los campos `finalTotalPrice` en ambos paquetes ya están calculados correctamente con Q45 (382.5 y 443.25 respectivamente). Solo `deliveryFee` y `totalPrice` dentro del JSON `quote` están mal.

### Cambios (solo datos, no código)

Actualizar el campo `quote` (JSONB) en la tabla `packages` para ambos IDs:

**Paquete `840cd3c1`** (price=250, serviceFee=125):
- `deliveryFee`: 60 → **45**
- `totalPrice`: 435 → **420** (250+125+45)
- `finalTotalPrice`: 382.5 (ya correcto, no cambia)

**Paquete `f3f6b5ec`** (price=295, serviceFee=147.5):
- `deliveryFee`: 60 → **45**
- `totalPrice`: 502.5 → **487.5** (295+147.5+45)
- `finalTotalPrice`: 443.25 (ya correcto, no cambia)

### Implementación
Dos sentencias SQL UPDATE usando `jsonb_set` para corregir `deliveryFee` y `totalPrice` dentro del campo `quote` de cada paquete. Se ejecutará via el insert tool de Supabase.

No se requieren cambios de código — la lógica de pricing ya clasifica Mixco correctamente como `guatemala_department`.

