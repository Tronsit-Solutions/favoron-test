

## Cambiar columnas: "Agendar" → fecha, "Fecha llamada" → Hora

### Cambios en `src/components/admin/cx/CustomerExperienceTable.tsx`

1. **Renombrar header** "Fecha llamada" → "Hora" (línea 101)
2. **Reemplazar el calendar date picker de "Fecha llamada"** (líneas 214-232) con un **time input** (`<input type="time">`) que guarde la hora en `call_date` como string (ej. "14:30")
3. Importar `Clock` de lucide-react para el ícono de hora

### Cambios en `src/hooks/useCustomerExperience.ts`

- `call_date` pasa de almacenar una fecha ISO completa a almacenar solo la hora (string como "14:30"). El campo en DB sigue siendo `timestamptz` pero se puede usar como string de hora, o bien almacenar solo el valor de texto. Como el campo ya existe como `timestamptz`, lo más limpio es guardar la hora como texto en el campo `call_date` (o crear un campo `call_time text`).

**Decisión**: Mejor agregar un campo `call_time text` a la tabla para no romper el tipo `timestamptz` de `call_date`. O, más simple: usar `call_date` como string de hora directamente ya que el hook lo trata como `string | null`.

→ Usaremos `call_date` para almacenar la hora como string "HH:mm" dado que la columna no tiene constraint de formato en la práctica del hook. Sin embargo, el tipo en DB es `timestamptz`... esto podría fallar.

**Plan final**: Crear una migración para agregar columna `call_time text` a `customer_experience_calls`, y usar esa para la hora. Mantener `call_date` sin cambios por compatibilidad.

### Resumen de cambios

1. **Migración SQL**: Agregar `call_time text` a `customer_experience_calls`
2. **`useCustomerExperience.ts`**: Agregar `call_time` al interface, fetch, y save
3. **`CustomerExperienceTable.tsx`**:
   - Header "Fecha llamada" → "Hora"
   - Reemplazar el calendar picker de esa columna con un `<input type="time">` que edite `call_time`
   - Agregar `Clock` icon
   - Agregar `call_time` al prop `onSave`

### Archivos
- Nueva migración SQL
- `src/hooks/useCustomerExperience.ts`
- `src/components/admin/cx/CustomerExperienceTable.tsx`

