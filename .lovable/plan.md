
# Plan: Mostrar País y Ciudad en Sección "Ruta" del Resumen

## Problema Identificado

En el paso 4 (Confirmar) del formulario de paquetes, la sección "Ruta" muestra:

```
Estados Unidos → Cualquier ciudad
```

Pero debería mostrar el país de destino también:

```
Estados Unidos → Guatemala, Cualquier ciudad
```

## Ubicación del Código

**Archivo**: `src/components/PackageRequestForm.tsx`
**Líneas**: 1395-1401 (dentro de `renderStep4()`)

## Código Actual

```tsx
{/* Ruta */}
<div className="space-y-2">
  <p className="text-sm font-medium text-muted-foreground">Ruta</p>
  <div className="flex items-center gap-2 text-sm">
    <Globe className="h-4 w-4 text-primary" />
    <span>{finalOrigin || 'No seleccionado'}</span>
    <span className="text-muted-foreground">→</span>
    <MapPin className="h-4 w-4 text-primary" />
    <span>{finalDestination || 'No seleccionado'}</span>
  </div>
</div>
```

## Solución

Actualizar la línea del destino para incluir `selectedCountry`:

```tsx
{/* Ruta */}
<div className="space-y-2">
  <p className="text-sm font-medium text-muted-foreground">Ruta</p>
  <div className="flex items-center gap-2 text-sm">
    <Globe className="h-4 w-4 text-primary" />
    <span>{finalOrigin || 'No seleccionado'}</span>
    <span className="text-muted-foreground">→</span>
    <MapPin className="h-4 w-4 text-primary" />
    <span>
      {selectedCountry 
        ? `${selectedCountry}${finalDestination ? `, ${finalDestination}` : ''}`
        : (finalDestination || 'No seleccionado')
      }
    </span>
  </div>
</div>
```

## Resultado Visual

| Antes | Después |
|-------|---------|
| Estados Unidos → Cualquier ciudad | Estados Unidos → Guatemala, Cualquier ciudad |
| USA → Miami | USA → Estados Unidos, Miami |

## Detalle Técnico

- `selectedCountry` ya está definido en el scope del componente (línea 154)
- Solo se modifica la línea 1400 para concatenar país + ciudad
- Si `selectedCountry` está vacío, se muestra solo `finalDestination` (comportamiento de fallback)
