

## Mostrar todas las columnas en la tabla preview

### Cambio

**Archivo: `src/components/admin/AdminBankFileTab.tsx`**

Actualizar la tabla para mostrar las 9 columnas (A-I) tal como aparecerán en el archivo XLS, incluyendo las columnas vacías B y F, la columna E (siempre "1"), y separar G y H en dos columnas distintas.

**Headers:**
`A: Titular | B: (vacía) | C: Cuenta | D: Tipo | E: (1) | F: (vacía) | G: Referencia | H: Referencia | I: Monto`

**Celdas:**
- B: vacío
- E: "1"
- F: vacío
- G: `Tip {trip_id corto}`
- H: `Tip {trip_id corto}`

También se corrige el bug de los dos `useMemo` duplicados que hacen `setSelectedIds` (líneas 20-26) — se reemplazarán por un solo `useEffect`.

