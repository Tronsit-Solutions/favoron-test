
## Mejorar Consistencia Visual del Modal "Información de Envío"

### Problemas Identificados

1. **Aviso "Importante:"** - Usa texto destructivo con borde inferior raw, debería usar el componente Alert
2. **Dirección de Entrega** - Usa `bg-info-muted` (azul claro) inconsistente con el resto del sitio que usa `bg-muted/30` (gris sutil)
3. **Fechas Importantes** - Misma inconsistencia con `bg-info-muted`
4. **Colores de fechas** - Usa `text-primary` (rojo) para fechas, debería usar colores más neutrales

### Cambios Propuestos

#### 1. Aviso Importante (líneas 43-45)
**Antes:** Texto raw con borde
```tsx
<div className="text-left text-destructive font-medium text-sm border-b border-destructive/20 pb-4">
  <strong>Importante:</strong> Después de completar...
</div>
```

**Después:** Usar componente Alert con icono
```tsx
<Alert className="border-amber-200 bg-amber-50">
  <Info className="h-4 w-4 text-amber-600" />
  <AlertDescription className="text-amber-800">
    <strong>Importante:</strong> Después de completar...
  </AlertDescription>
</Alert>
```

#### 2. AddressDisplay (líneas 53-68)
Cambiar de `variant="info"` a `variant="success"` o crear nuevo estilo que use `bg-muted/30`

#### 3. Sección Fechas Importantes (líneas 78-130)
**Antes:**
```tsx
<div className="bg-info-muted border-info-border border rounded-lg p-4">
```

**Después:**
```tsx
<div className="bg-muted/30 rounded-lg p-4">
```

#### 4. Colores de Fechas
**Antes:**
```tsx
<p className="text-sm font-semibold text-primary">fecha...</p>
```

**Después:**
```tsx
<p className="text-sm font-semibold text-foreground">fecha...</p>
```

### Resultado Visual Esperado

| Elemento | Antes | Después |
|----------|-------|---------|
| Aviso | Texto rojo con línea | Card amarillo con icono |
| Dirección | Fondo azul claro | Fondo gris sutil |
| Fechas | Fondo azul, texto rojo | Fondo gris, texto neutral |
| Consistencia | Diferente a otros modales | Igual a TripDetailModal |
