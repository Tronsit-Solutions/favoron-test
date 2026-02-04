

## Mostrar Estado de "Empaque Original" en Todas las Vistas Relevantes

### Objetivo
Agregar un indicador visual del campo `needsOriginalPackaging` que muestre claramente el estado (Si/No) en todas las vistas donde se muestran productos.

### Indicadores visuales

| Valor | Indicador |
|-------|-----------|
| `true` | 📦 Conservar empaque original (amber/amarillo) |
| `false` o no definido | 📦 No requiere empaque original (gris/muted) |

### Archivos a modificar

#### 1. `src/components/dashboard/traveler/TravelerPackageDetails.tsx`
**Vista del viajero - Detalles del paquete asignado**

Agregar despues del link del producto en cada producto (lineas ~182 y ~243):

```tsx
{/* Indicador de empaque original */}
<p className={`text-xs px-2 py-1 rounded mt-1 flex items-center gap-1 ${
  product.needsOriginalPackaging 
    ? 'text-amber-600 bg-amber-50' 
    : 'text-muted-foreground bg-muted/30'
}`}>
  📦 {product.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
</p>
```

#### 2. `src/components/QuoteDialog.tsx`
**Vista del viajero al aceptar asignacion y shopper al ver cotizacion**

Agregar despues del tip en cada producto (linea ~928):

```tsx
{/* Indicador de empaque */}
<div className={`flex items-center gap-1.5 mb-2 text-sm ${
  product.needsOriginalPackaging 
    ? 'text-amber-600' 
    : 'text-muted-foreground'
}`}>
  <span className={`px-2 py-1 rounded text-xs ${
    product.needsOriginalPackaging 
      ? 'bg-amber-50' 
      : 'bg-muted/30'
  }`}>
    📦 {product.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
  </span>
</div>
```

#### 3. `src/components/admin/PackageDetailModal.tsx`
**Vista del admin - Modal de detalles del paquete**

Agregar en la seccion de productos detallados, junto con otros campos del producto.

#### 4. `src/components/admin/AdminMatchDialog.tsx`
**Vista del admin - Cuando hace matching**

Agregar badge despues del link del producto (linea ~771):

```tsx
{product.needsOriginalPackaging !== undefined && (
  <Badge 
    variant="outline" 
    className={`text-[10px] ${
      product.needsOriginalPackaging 
        ? 'text-amber-600 border-amber-300 bg-amber-50' 
        : 'text-gray-500 border-gray-300 bg-gray-50'
    }`}
  >
    📦 {product.needsOriginalPackaging ? 'Empaque original' : 'Sin empaque'}
  </Badge>
)}
```

#### 5. `src/components/admin/ProductQuickViewModal.tsx`
**Vista rapida de productos**

Agregar en getProductInfo() el campo y mostrarlo en la UI.

#### 6. `src/components/admin/ProductDetailModal.tsx`
**Modal de detalle de productos**

Agregar indicador similar en cada producto listado.

#### 7. `src/components/dashboard/PackageProductDisplay.tsx`
**Display de productos en dashboard del shopper**

Agregar indicador dentro de cada Card de producto.

### Estilo visual consistente

El indicador usara estilos consistentes en todas las vistas:

- **Cuando SI necesita empaque**: 
  - Color: Amber/amarillo (`text-amber-600`, `bg-amber-50`, `border-amber-300`)
  - Texto: "Conservar empaque original" o "Empaque original"

- **Cuando NO necesita empaque**:
  - Color: Gris (`text-muted-foreground`, `bg-muted/30`, `border-gray-300`)
  - Texto: "No requiere empaque original" o "Sin empaque"

### Resultado esperado

| Vista | Ubicacion del indicador |
|-------|------------------------|
| Viajero - Dashboard | Dentro de cada producto en "Ver detalles" |
| Viajero - Aceptar asignacion | Debajo del tip de cada producto |
| Shopper - Ver cotizacion | En cada producto de la cotizacion |
| Admin - Detalle de paquete | En la seccion de productos |
| Admin - Matching | Junto al nombre de cada producto |
| Admin - Vista rapida | En los detalles del producto |
| Shopper - Dashboard | En cada tarjeta de producto |

### Resumen de archivos a modificar
1. `src/components/dashboard/traveler/TravelerPackageDetails.tsx`
2. `src/components/QuoteDialog.tsx`
3. `src/components/admin/PackageDetailModal.tsx`
4. `src/components/admin/AdminMatchDialog.tsx`
5. `src/components/admin/ProductQuickViewModal.tsx`
6. `src/components/admin/ProductDetailModal.tsx`
7. `src/components/dashboard/PackageProductDisplay.tsx`

