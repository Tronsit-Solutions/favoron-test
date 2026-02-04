

## Mejoras de UI para el Modal "Tip Asignado"

### Objetivo
Alinear el diseño del modal de aceptación de tip con el sistema de diseño de Favorón, mejorando la consistencia visual y la jerarquía de información.

---

### Cambios Propuestos

#### 1. Header del Modal
**Archivo:** `src/components/QuoteDialog.tsx` (lineas 721-729)

**Antes:**
- Titulo verde gradiente pequeño
- Subtitulo gris diminuto

**Despues:**
- Usar el patron de header con icono circular como en otras secciones
- Titulo mas prominente con el color primario del sistema
- Subtitulo mas legible

```tsx
{isTravelerContext ? (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
      <Gift className="h-5 w-5 text-success" />
    </div>
    <div>
      <DialogTitle className="text-lg font-bold text-foreground">
        Tip Asignado
      </DialogTitle>
      <DialogDescription className="text-sm text-muted-foreground">
        Revisa los detalles y decide si aceptas este encargo
      </DialogDescription>
    </div>
  </div>
) : (...)}
```

---

#### 2. Tarjeta del Tip (Hero Card)
**Archivo:** `src/components/QuoteDialog.tsx` (lineas 866-882)

**Mejoras:**
- Agregar sombra sutil del design system (`shadow-soft`)
- Mejorar el contraste del icono
- Hacer el monto mas prominente

```tsx
<div className="rounded-xl bg-gradient-to-r from-success/10 via-emerald-50 to-green-50 border border-success/20 p-4 shadow-soft">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center shadow-sm">
      <Banknote className="w-6 h-6 text-white" />
    </div>
    <div>
      <span className="text-sm text-muted-foreground font-medium">Tu tip por llevarte este paquete</span>
      <p className="text-3xl font-bold text-success">
        Q{displayAmount.toFixed(2)}
      </p>
    </div>
  </div>
</div>
```

---

#### 3. Seccion de Producto
**Archivo:** `src/components/QuoteDialog.tsx` (lineas 884-993)

**Cambios:**
- Usar Card del design system con bordes mas sutiles
- Mejorar el header de seccion con icono circular
- Quitar fondo del indicador de empaque (solo texto coloreado)
- Estilizar boton "Ver producto" como boton secundario estandar

```tsx
{/* Section Header mejorado */}
<div className="flex items-center gap-2 pb-3 border-b">
  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
    <Package className="h-4 w-4 text-primary" />
  </div>
  <span className="text-sm font-semibold text-foreground">Producto solicitado</span>
</div>

{/* Indicador de empaque sin fondo */}
<p className={`text-xs flex items-center gap-1.5 mt-2 ${
  product.needsOriginalPackaging 
    ? 'text-amber-600' 
    : 'text-muted-foreground'
}`}>
  📦 {product.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
</p>

{/* Boton consistente */}
<Button 
  variant="outline" 
  size="sm"
  className="w-full mt-3"
  onClick={() => window.open(productLink, '_blank')}
>
  <ExternalLink className="h-4 w-4 mr-2" />
  Ver producto en tienda
</Button>
```

---

#### 4. Seccion de Mensaje al Shopper
**Mejoras:**
- Agregar icono circular como en otras secciones
- Mejor espaciado

---

#### 5. Checkbox de Confirmacion
**Mejoras:**
- Envolver en una Card sutil para destacar su importancia
- Usar colores del design system

```tsx
<div className="bg-muted/30 rounded-lg p-3 border border-muted/40">
  <div className="flex items-start gap-3">
    <Checkbox ... />
    <Label className="text-sm leading-relaxed">
      Confirmo que he revisado el producto y que puedo llevarlo en mi maleta
    </Label>
  </div>
</div>
```

---

### Resumen Visual de Cambios

| Elemento | Antes | Despues |
|----------|-------|---------|
| Header | Texto gradiente verde | Icono circular + titulo negro |
| Tip Card | Icono verde sobre verde | Icono blanco sobre verde solido |
| Indicador empaque | Franja con fondo | Solo texto coloreado |
| Boton producto | Link estilizado custom | Button variant="outline" |
| Checkbox | Flotante | Envuelto en card sutil |

---

### Archivos a Modificar

1. `src/components/QuoteDialog.tsx` - Cambios principales en la vista del viajero

---

### Resultado Esperado
El modal se sentira mas integrado con el resto de la plataforma, usando:
- Iconos en contenedores circulares (patron de HeroSection)
- Colores del design system (primary blue, success green)
- Sombras y bordes consistentes (shadow-soft, border-border/50)
- Espaciado uniforme
- Jerarquia visual clara

