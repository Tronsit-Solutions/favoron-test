

## Corregir Texto Truncado en Export de Excel

### Problema
La descripción de pedidos se trunca a 50 caracteres en el hook `useActivityTimeline.tsx` antes de almacenarse en el `ActivityItem`. Cuando se exporta a Excel, se usa esta versión truncada en lugar del texto completo.

### Solución
Agregar un campo `fullDescription` al `ActivityItem` que conserve el texto original completo para usarlo en el export.

### Cambios técnicos

#### 1. Modificar `src/hooks/useActivityTimeline.tsx`

**Agregar campo al interface:**
```typescript
export interface ActivityItem {
  // ... campos existentes
  description: string;          // Para mostrar en tabla (truncado)
  fullDescription?: string;     // Para export (completo)
  // ...
}
```

**Guardar descripción completa en packages:**
```typescript
items.push({
  // ... otros campos
  description: pkg.item_description?.substring(0, 50) + (pkg.item_description?.length > 50 ? '...' : ''),
  fullDescription: pkg.item_description || '',  // ← Nuevo: texto completo
  // ...
});
```

#### 2. Modificar `src/components/admin/ActivityTimelineTab.tsx`

**Usar `fullDescription` en export Excel:**
```typescript
// En handleExportExcel, para pedidos:
return {
  'Tipo': 'Pedido',
  'Usuario': item.userName,
  'WhatsApp': item.userPhone || 'N/A',
  'Canal': getChannelLabel(item.acquisitionChannel),
  'Email': item.userEmail || 'N/A',
  'Descripción': item.fullDescription || item.description,  // ← Usar texto completo
  // ...
};
```

### Resultado esperado
- **En la tabla UI**: Descripciones truncadas a 50 caracteres (para evitar filas muy anchas)
- **En el Excel**: Descripciones completas sin truncar

