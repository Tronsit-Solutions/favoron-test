

## Agregar Columna de Paquetes Confirmados en Viajes

### Objetivo
Mostrar las descripciones de los paquetes que el viajero llevó (paquetes confirmados/pagados) en una nueva columna en la tabla de viajes.

### Datos disponibles
El hook `useActivityTimeline` ya tiene acceso a todos los paquetes con su `matched_trip_id` y `item_description`. Solo necesitamos agrupar esta información por viaje.

### Cambios técnicos

#### 1. Modificar el hook `useActivityTimeline.tsx`

**Agregar campo al interface `ActivityItem`:**
```typescript
// Trip-specific - agregar:
confirmedPackageDescriptions?: string[];
```

**Agrupar descripciones de paquetes por viaje:**
```typescript
// En el cálculo de packageCounts, también guardar descripciones
const packageDetails: Record<string, { 
  confirmed: number; 
  completed: number;
  descriptions: string[];
}> = {};

(packagesData || []).forEach((pkg: PackageData) => {
  if (pkg.matched_trip_id && PAID_STATUSES.includes(pkg.status)) {
    if (!packageDetails[pkg.matched_trip_id]) {
      packageDetails[pkg.matched_trip_id] = { confirmed: 0, completed: 0, descriptions: [] };
    }
    packageDetails[pkg.matched_trip_id].confirmed++;
    packageDetails[pkg.matched_trip_id].descriptions.push(
      pkg.item_description?.substring(0, 30) + (pkg.item_description?.length > 30 ? '...' : '')
    );
    if (pkg.status === 'completed') {
      packageDetails[pkg.matched_trip_id].completed++;
    }
  }
});
```

**Incluir descripciones en el ActivityItem:**
```typescript
items.push({
  // ... campos existentes
  confirmedPackageDescriptions: counts.descriptions || []
});
```

#### 2. Modificar `TripsTimelineTable.tsx`

**Agregar nueva columna "Detalle Paquetes":**
```typescript
<TableHead className="w-[200px]">Detalle Paquetes</TableHead>
```

**Renderizar las descripciones:**
```typescript
<TableCell>
  {item.confirmedPackageDescriptions && item.confirmedPackageDescriptions.length > 0 ? (
    <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
      {item.confirmedPackageDescriptions.map((desc, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{desc}</span>
        </div>
      ))}
    </div>
  ) : (
    <span className="text-muted-foreground text-xs">Sin paquetes</span>
  )}
</TableCell>
```

### Resultado visual esperado

| Usuario | Ruta | ... | Paquetes | Detalle Paquetes |
|---------|------|-----|----------|------------------|
| Juan P. | LA → GT | ... | 2 confirmados | 📦 iPhone 15 Pro Max... |
|         |      |     |           | 📦 AirPods Pro 2... |

