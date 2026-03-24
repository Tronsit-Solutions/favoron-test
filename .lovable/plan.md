

## Auto-rellenar columna "Banco" con código numérico

### Cambio — `src/components/admin/AdminBankFileTab.tsx`

Agregar un mapa de nombres de banco → código numérico basado en la tabla proporcionada, y usarlo para auto-rellenar `colF` al inicializar los rows.

**1) Nuevo mapa de bancos (constante fuera del componente):**

```ts
const BANK_CODE_MAP: Record<string, string> = {
  'banco de guatemala': '01',
  'credito hipotecario nacional': '04',
  'banco de los trabajadores': '12',
  'banco cuscatlan': '13',
  'banco industrial': '15',
  'banco de desarrollo rural': '16',
  'banrural': '16',
  'interbanco': '19',
  'citibank': '30',
  'vivibanco': '36',
  'banco ficohsa': '39',
  'ficohsa': '39',
  'promerica': '40',
  'banco de antigua': '41',
  'banco de america central': '42',
  'bac': '42',
  'banco agromercantil': '44',
  'agromercantil': '44',
  'banco azteca': '47',
  'banco inv': '48',
  'banco credicorp': '49',
  'banco nexa': '50',
  'banco multimoney': '51',
};

const getBankCode = (bankName: string): string => {
  if (!bankName) return '';
  const lower = bankName.toLowerCase().trim();
  for (const [key, code] of Object.entries(BANK_CODE_MAP)) {
    if (lower.includes(key)) return code;
  }
  return ''; // No seguro → omitir
};
```

**2) En el `useEffect` de inicialización (línea 48)**, cambiar `colF: ""` por:

```ts
colF: getBankCode(o.bank_name || ""),
```

Esto usa el campo `bank_name` que ya viene en las payment orders para buscar el código. Si no encuentra match, deja vacío (el usuario puede editarlo manualmente).

### Archivo
- `src/components/admin/AdminBankFileTab.tsx`

