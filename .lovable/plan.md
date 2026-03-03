

## Plan: Corregir correo de confirmación de viaje

### Problemas
1. **Países en minúscula sin acentos**: El email usa el `value` del país (slug como `espana`, `guatemala`) en vez del `label` de presentación (`España`, `Guatemala`).
2. **Unidad incorrecta**: Dice "lb" pero debería decir "kg".

### Cambios

**`src/hooks/useDashboardActions.tsx`** (líneas ~236-244)

1. Importar `COUNTRIES` y `MAIN_COUNTRIES` desde `@/lib/countries` para hacer lookup del label.
2. Crear una función helper inline para resolver el nombre de presentación del país:
   ```ts
   const getCountryLabel = (val: string) => 
     [...MAIN_COUNTRIES, ...COUNTRIES].find(c => c.value === val)?.label || val;
   ```
3. Usar `getCountryLabel(dbTripData.from_country)` y `getCountryLabel(dbTripData.to_country)` en el template del email en lugar del valor crudo.
4. Cambiar `lb` → `kg` en la línea del espacio disponible.

### Resultado esperado
- Origen: **Madrid, España** (en vez de "Madrid, espana")
- Destino: **Guatemala City, Guatemala** (en vez de "Guatemala City, guatemala")
- Espacio disponible: **10 kg** (en vez de "10 lb")

