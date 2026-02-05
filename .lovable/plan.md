

## Rediseño del Modal "Información de Envío"

### Problema
El modal actual mezcla diferentes estilos visuales:
- Alert amarillo (warning)
- Tarjeta verde (AddressDisplay variant="success")
- Secciones grises (bg-muted/30)

Esto crea un aspecto fragmentado e inconsistente con otros modales como `TripDetailModal`.

### Solución
Rediseñar completamente siguiendo el patrón exacto de `TripDetailModal` que usa:
- Headers simples con iconos grises (`text-muted-foreground`)
- Todas las secciones con `bg-muted/30 rounded-lg p-3 sm:p-4`
- Grids para organizar datos con etiquetas/valores

### Cambios en ShippingInfoModal.tsx

#### 1. Eliminar AddressDisplay
Reemplazar el componente `AddressDisplay` por un layout inline siguiendo el patrón de TripDetailModal:

```tsx
{/* Dirección de Entrega */}
{travelerAddress && (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <h3 className="font-semibold text-sm sm:text-base">Dirección de Entrega</h3>
    </div>
    <div className="bg-muted/30 rounded-lg p-3 sm:p-4 space-y-2">
      {/* Grid rows for each field */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
        <div className="text-xs sm:text-sm font-medium text-muted-foreground">Destinatario:</div>
        <div className="sm:col-span-2 text-xs sm:text-sm">{travelerAddress.recipientName}</div>
      </div>
      {/* ... más campos */}
    </div>
  </div>
)}
```

#### 2. Simplificar Alert
Convertir a un texto informativo más sutil:

```tsx
<div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
  <strong className="text-foreground">Importante:</strong> Después de completar tu compra...
</div>
```

#### 3. Unificar Fechas
Ya usa `bg-muted/30`, solo ajustar el header:

```tsx
<div className="flex items-center gap-2">
  <Calendar className="h-4 w-4 text-muted-foreground" />
  <h3 className="font-semibold text-sm sm:text-base">Fechas Importantes</h3>
</div>
```

### Resultado Visual Esperado

| Antes | Después |
|-------|---------|
| Alert amarillo destacado | Nota sutil gris |
| Tarjeta verde con bordes | Sección gris uniforme |
| Headers con iconos negros | Headers con iconos grises |
| Mezcla de colores | Todo `bg-muted/30` |

### Archivos a Modificar
- `src/components/dashboard/ShippingInfoModal.tsx` - Rediseño completo del contenido

