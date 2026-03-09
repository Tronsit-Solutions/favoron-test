

## Fix: Alinear tres puntos y chat en columna derecha (móvil, en tránsito)

### Problema
En la screenshot, el botón de chat aparece desalineado respecto a los tres puntos. La columna derecha usa `justify-content: space-between` con un spacer `h-7`, lo que empuja el chat demasiado abajo cuando el contenido del card es corto.

### Cambio en `src/components/dashboard/CollapsiblePackageCard.tsx`

**Línea 665 — Cambiar la columna derecha para usar gap fijo en vez de space-between:**

Reemplazar:
```tsx
<div className="flex flex-col items-center flex-shrink-0 ml-2" style={{ justifyContent: isChatAvailable ? 'space-between' : 'flex-start' }}>
  {/* Three dots */}
  {viewMode === 'user' && <DropdownMenu>...</DropdownMenu>}
  {/* Chat */}
  {isChatAvailable && <Button chat />}
  {/* Spacer */}
  {isChatAvailable && <div className="h-7" />}
</div>
```

Con:
```tsx
<div className="flex flex-col items-center flex-shrink-0 ml-2 gap-3">
  {/* Three dots */}
  {viewMode === 'user' && <DropdownMenu>...</DropdownMenu>}
  {/* Chat */}
  {isChatAvailable && <Button chat />}
</div>
```

Esto coloca los tres puntos arriba y el chat inmediatamente debajo con un gap de `12px`, eliminando el spacer y el `space-between` que causaba el desalineamiento. Ambos controles quedan claramente apilados en la columna derecha.

