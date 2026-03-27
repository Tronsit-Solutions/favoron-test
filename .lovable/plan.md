

## Ocultar descripción de "Mis Viajes" en móvil

### Cambio

En `src/components/Dashboard.tsx` línea 897, agregar la clase `hidden sm:block` al `<p>` de la descripción para que solo se muestre en pantallas `sm` (640px) o mayores.

```tsx
<p className="text-muted-foreground text-sm sm:text-base hidden sm:block">
```

Un solo cambio, una sola línea.

