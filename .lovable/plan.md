

# Plan: Mostrar País y Ciudad en Destino (AdminApprovalsTab)

## Problema Identificado

En `AdminApprovalsTab.tsx`, línea 264-266, el destino muestra solo "Cualquier ciudad" pero debería mostrar "Guatemala, Cualquier ciudad".

El código actual (línea 265):
```tsx
Destino: {pkg.package_destination_country ? `${getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country} - ` : ''}{pkg.package_destination}
```

## Problema con el Código Actual

1. La lógica condicional usa `" - "` como separador, pero debería usar `", "`
2. Si `getCountryLabel` devuelve `undefined`, solo se muestra el valor raw sin formateo consistente

## Solución

Simplificar y mejorar la lógica de display en línea 265:

```tsx
<p className="text-xs sm:text-sm text-muted-foreground break-words">
  Origen: {pkg.purchase_origin} → Destino: {
    pkg.package_destination_country 
      ? `${getCountryLabel(pkg.package_destination_country) || pkg.package_destination_country}${pkg.package_destination ? `, ${pkg.package_destination}` : ''}`
      : (pkg.package_destination || 'No especificado')
  }
</p>
```

## Resultado Visual

| Antes | Después |
|-------|---------|
| Origen: Guatemala → Destino: Cualquier ciudad | Origen: Guatemala → Destino: Guatemala, Cualquier ciudad |
| Origen: USA → Destino: Miami | Origen: USA → Destino: Guatemala, Miami |

## Archivo a Modificar

- `src/components/admin/AdminApprovalsTab.tsx` - Línea 265

