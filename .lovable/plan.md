

## Fix: Barra de tabs del Admin no se desliza en móvil

### Problema
El componente `MobileTabs` usa `ScrollArea` de Radix, que intercepta los eventos táctiles y no permite el scroll horizontal nativo en móvil. El `overflow-x-auto` en el div interno compite con el viewport de Radix.

### Solución
Reemplazar `ScrollArea` por un div nativo con `overflow-x-auto` y `-webkit-overflow-scrolling: touch` en `src/components/ui/mobile-tabs.tsx`. Esto permite scroll horizontal nativo por touch sin depender de Radix.

### Cambio en `src/components/ui/mobile-tabs.tsx`

```tsx
// Antes:
<ScrollArea className="w-full">
  <div className="flex w-full h-auto p-1 gap-1 bg-muted/30 rounded-none overflow-x-auto">
    ...
  </div>
</ScrollArea>

// Después:
<div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
  <div className="flex w-max h-auto p-1 gap-1 bg-muted/30 rounded-none">
    ...
  </div>
</div>
```

Cambio clave: el div interno pasa de `w-full` a `w-max` para que su ancho se expanda según el contenido, y el div externo maneja el scroll nativo. Se elimina el import de `ScrollArea`.

