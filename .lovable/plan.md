

## Unificar Códigos de Descuento y Boost en una sola página

### Concepto
Combinar la gestión de Discount Codes y Boost Codes en la página `/admin/discounts` (AdminDiscounts.tsx), usando tabs de nivel superior para separar las dos secciones: "Códigos de Descuento" (shoppers) y "Tip Boost Codes" (viajeros). Eliminar la página separada de AdminBoostCodes.

### Cambios

1. **`src/pages/AdminDiscounts.tsx`** - Refactorizar completamente:
   - Renombrar titulo a "Códigos Promocionales" (paraguas para ambos tipos)
   - Agregar tabs principales: "Descuentos" (icono Ticket) y "Tip Boost" (icono Rocket)
   - Tab "Descuentos": mantiene toda la lógica actual de discount_codes/discount_code_usage
   - Tab "Tip Boost": integrar toda la lógica de boost_codes/boost_code_usage (copiar del AdminBoostCodes actual)
   - Cada tab tiene su propio botón "Nuevo", dialog de creación/edición, stats cards, y tabla con sub-tabs activos/inactivos
   - Agregar estados para boost codes y boost usage, con sus respectivos fetch, CRUD y formularios

2. **`src/pages/AdminBoostCodes.tsx`** - Eliminar (ya no se necesita)

3. **`src/App.tsx`** - Eliminar la ruta `/admin/boost-codes` y el import de AdminBoostCodes

4. **`src/pages/AdminControl.tsx`** - Actualizar la tarjeta de "Códigos de Descuento":
   - Cambiar título a "Códigos Promocionales"
   - Cambiar descripción a "Descuentos para shoppers y tip boosts para viajeros"
   - No agregar tarjeta separada de boost codes

### Estructura de la UI unificada

```text
Códigos Promocionales
├── [Tab: Descuentos (Ticket)]
│   ├── Stats: Usos | Total Descontado | Usuarios
│   ├── [Botón: + Nuevo Descuento]
│   └── Sub-tabs: Activos | Inactivos
│       └── Tabla de discount_codes
└── [Tab: Tip Boost (Rocket)]
    ├── Stats: Usos | Total Boost | Viajeros
    ├── [Botón: + Nuevo Boost]
    └── Sub-tabs: Activos | Inactivos
        └── Tabla de boost_codes
```

### Archivos a modificar
- `src/pages/AdminDiscounts.tsx` (refactorizar - agregar sección boost)
- `src/pages/AdminBoostCodes.tsx` (eliminar)
- `src/App.tsx` (eliminar ruta boost-codes)
- `src/pages/AdminControl.tsx` (actualizar tarjeta)

