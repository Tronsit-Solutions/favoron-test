

## Exportar Descripciones Completas de Paquetes en Excel

### Problema Identificado

En `useActivityTimeline.tsx` (lineas 168-171), las descripciones se truncan al guardarlas:

```tsx
const desc = pkg.item_description || 'Sin descripcion';
counts[pkg.matched_trip_id].descriptions.push(
  desc.substring(0, 30) + (desc.length > 30 ? '...' : '')
);
```

El Excel usa estas mismas descripciones truncadas, resultando en texto cortado como:
- "Hub USB C | Pedido de 3 productos: Lattafa..."

---

### Solucion

Almacenar tanto las descripciones truncadas (para UI) como las completas (para Excel export).

---

### Cambios Tecnicos

**Archivo: src/hooks/useActivityTimeline.tsx**

1. **Actualizar el tipo de packageCounts** (linea 118):
```tsx
const [packageCounts, setPackageCounts] = useState<Record<string, { 
  confirmed: number; 
  completed: number; 
  descriptions: string[];
  fullDescriptions: string[];  // NUEVO
}>>({});
```

2. **Inicializar con ambos arrays** (linea 164):
```tsx
counts[pkg.matched_trip_id] = { confirmed: 0, completed: 0, descriptions: [], fullDescriptions: [] };
```

3. **Guardar descripcion completa tambien** (lineas 168-171):
```tsx
const desc = pkg.item_description || 'Sin descripcion';
counts[pkg.matched_trip_id].descriptions.push(
  desc.substring(0, 30) + (desc.length > 30 ? '...' : '')
);
counts[pkg.matched_trip_id].fullDescriptions.push(desc);  // NUEVO
```

4. **Actualizar interface ActivityItem** (despues de linea 23):
```tsx
confirmedPackageDescriptions?: string[];
fullPackageDescriptions?: string[];  // NUEVO
```

5. **Pasar fullDescriptions al item** (linea 241):
```tsx
confirmedPackageDescriptions: counts.descriptions || [],
fullPackageDescriptions: counts.fullDescriptions || []  // NUEVO
```

---

**Archivo: src/components/admin/ActivityTimelineTab.tsx**

6. **Usar descripciones completas en Excel** (linea 96):
```tsx
'Detalle Paquetes': item.fullPackageDescriptions?.join(' | ') || 'Sin paquetes',
```

---

### Resultado

- **UI**: Sigue mostrando descripciones truncadas para mejor legibilidad
- **Excel**: Exporta las descripciones completas de cada paquete
- Ejemplo en Excel: "Hub USB C 7 en 1 Adaptador | Pedido de 3 productos: Lattafa Oud Mood Elixir 100ml"

