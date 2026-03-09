

## Reubicar botón de chat a la derecha del título sin solapamiento

### Problema
El botón de chat está posicionado como `absolute top-3 right-10`, lo que lo solapa con el texto del título del pedido.

### Solución
Mover el botón de chat **dentro del row del título** (línea 400), para que flote naturalmente en el espacio libre a la derecha del nombre del paquete.

### Cambio en `src/components/dashboard/CollapsiblePackageCard.tsx`

**Líneas 400-419** — Integrar el botón de chat en el flex row del título:

```tsx
<div className="flex items-start gap-2 w-full">
  <Package className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
  <div className="flex-1 min-w-0">
    <CardTitle className="...">
      {renderPackageName()}
    </CardTitle>
  </div>
  {/* Chat button inline a la derecha */}
  {isChatAvailable && (
    <div className="relative flex-shrink-0 ml-auto mr-8">
      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 rounded-full" onClick={handleChatClick}>
        <MessageCircle className="h-6 w-6 text-primary" />
      </Button>
      {needsAction && (
        <NotificationBadge count={1} className="absolute -top-1 -right-1" />
      )}
    </div>
  )}
</div>
```

Y eliminar el bloque absoluto del chat (líneas 409-419) que ya no se necesita.

Con `mr-8` se deja espacio para los 3 puntos del menú en la esquina superior derecha. El `flex-shrink-0` evita que el botón se comprima, y `ml-auto` lo empuja al espacio libre.

