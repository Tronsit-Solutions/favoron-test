

## Refinamientos Móviles para el Modal "Tip Asignado"

### Problemas Identificados en Móvil

1. **Espaciado excesivo** - Los gaps entre secciones son muy grandes para pantallas pequeñas
2. **Header demasiado alto** - El icono circular y texto ocupan mucho espacio vertical
3. **Tip Card no compacta** - El layout horizontal puede ser mejor aprovechado
4. **Sección de mensaje con mucho padding** - Desperdicia espacio vertical
5. **Botones de acción** - Ya son full-width pero el padding puede reducirse

---

### Cambios Propuestos

#### 1. Espaciado General Más Compacto
**Archivo:** `src/components/QuoteDialog.tsx`

Reducir el espaciado en móvil:

```tsx
// Línea 747 - Cambiar space-y-4 a space-y-3 en móvil
<div className={`flex-1 overflow-y-auto ${isMobile ? 'space-y-3' : 'space-y-4 sm:space-y-6'} pr-1`}>
```

#### 2. Header Más Compacto en Móvil
**Líneas 721-734**

Reducir tamaño del icono y texto en móvil:

```tsx
<div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
  <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-success/10 flex items-center justify-center shrink-0`}>
    <Gift className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-success`} />
  </div>
  <div>
    <DialogTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-foreground text-left`}>
      Tip Asignado
    </DialogTitle>
    <DialogDescription className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground text-left`}>
      Revisa los detalles y decide si aceptas este encargo
    </DialogDescription>
  </div>
</div>
```

#### 3. Tip Card Más Compacta
**Líneas 871-885**

Reducir padding e iconos en móvil:

```tsx
<div className={`rounded-xl bg-gradient-to-r from-success/10 via-emerald-50 to-green-50 dark:from-success/20 dark:via-emerald-900/20 dark:to-green-900/10 border border-success/20 ${isMobile ? 'p-3' : 'p-4'} shadow-soft`}>
  <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
    <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-success flex items-center justify-center shadow-sm`}>
      <Banknote className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-white`} />
    </div>
    <div>
      <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>
        Tu tip por llevarte este paquete
      </span>
      <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-success`}>
        Q{displayAmount.toFixed(2)}
      </p>
    </div>
  </div>
</div>
```

#### 4. Sección de Producto Más Compacta
**Líneas 888-993**

Reducir padding y mejorar legibilidad:

```tsx
// Container principal
<div className={`${isTravelerContext ? 'bg-muted/30 border border-muted/40' : 'bg-muted/50 border'} rounded-lg ${isMobile ? 'p-3' : 'p-4'} max-w-full`}>

// Header de sección
<div className={`flex items-center ${isMobile ? 'gap-1.5 pb-2' : 'gap-2 pb-3'} border-b border-muted/40`}>
  <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg bg-primary/10 flex items-center justify-center`}>
    <Package className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-primary`} />
  </div>
  <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>Producto solicitado</span>
</div>

// Card de producto
<div className={`bg-background/60 rounded-lg ${isMobile ? 'p-2.5' : 'p-3'} border border-muted/30`}>
```

#### 5. Sección de Mensaje Más Compacta
**Líneas 1700-1730**

Reducir padding y tamaño de icono:

```tsx
<div className={`${isTravelerContext ? 'bg-card border-2 border-muted/60 rounded-xl' : ''} ${isMobile ? 'p-3' : 'p-4'}`}>
  <div className="max-w-full overflow-hidden space-y-1.5">
    <div className="flex items-center gap-1.5">
      <div className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} rounded-lg ${isTravelerContext ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center`}>
        <FileText className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${isTravelerContext ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <Label htmlFor="message" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
        Mensaje para el shopper
      </Label>
      <span className="text-xs text-muted-foreground">(opcional)</span>
    </div>
    <Textarea 
      rows={isMobile ? 2 : 2}
      className={`${isMobile ? 'text-sm' : ''} resize-none border-muted/60 focus:border-primary/40`}
      ...
    />
  </div>
</div>
```

#### 6. Checkbox de Confirmación Más Compacto
**Líneas 1772-1792**

Reducir padding en móvil:

```tsx
<div className={`bg-muted/30 rounded-lg ${isMobile ? 'p-2.5' : 'p-3'} border border-muted/40`}>
  <div className={`flex items-start ${isMobile ? 'gap-2' : 'gap-3'}`}>
    <Checkbox ... className="mt-0.5" />
    <label className={`${isMobile ? 'text-xs' : 'text-sm'} cursor-pointer leading-relaxed`}>
      <span className="font-medium text-foreground">
        Confirmo que he revisado el producto y que puedo llevarlo en mi maleta
      </span>
      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground mt-0.5`}>
        Al marcar esta casilla, confirmas que el producto cumple con las restricciones
      </p>
    </label>
  </div>
</div>
```

#### 7. Botones de Acción
**Líneas 1795-1818**

Ya están bien pero ajustar padding:

```tsx
<div className={`flex justify-end gap-2 ${isMobile ? 'pt-3' : 'pt-4'} ${isTravelerContext ? 'border-t-2 border-muted/40' : 'border-t'}`}>
```

---

### Resumen de Cambios

| Elemento | Desktop | Móvil |
|----------|---------|-------|
| Espaciado general | space-y-4/6 | space-y-3 |
| Icono header | 40x40px | 32x32px |
| Título | text-lg | text-base |
| Tip card padding | p-4 | p-3 |
| Tip amount | text-3xl | text-2xl |
| Icono tip | 48x48px | 40x40px |
| Product section | p-4 | p-3 |
| Message section | p-4 | p-3 |
| Checkbox label | text-sm | text-xs |

---

### Archivo a Modificar

1. `src/components/QuoteDialog.tsx` - Aplicar clases condicionales basadas en `isMobile`

### Resultado Esperado

El modal ocupará menos espacio vertical en móvil, permitiendo ver más contenido sin scroll excesivo, mientras mantiene la misma información y funcionalidad.

