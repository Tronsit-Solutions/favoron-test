
## Agregar fecha limite al modal de detalles del pedido

### Cambio
En `src/components/dashboard/ProductDetailsModal.tsx`, agregar la fecha limite (`pkg.delivery_deadline`) debajo del titulo del modal, para que el admin pueda ver rapidamente cuando vence el pedido.

### Detalle tecnico

**Archivo: `src/components/dashboard/ProductDetailsModal.tsx`**

Agregar despues del `DialogTitle` (dentro del `DialogHeader`) una linea que muestre la fecha limite formateada:

```tsx
<p className="text-sm text-muted-foreground">
  Fecha limite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  })}
</p>
```

Esto mostrara algo como: **Fecha limite: 28 de febrero de 2025** justo debajo del titulo "Detalles del pedido".
