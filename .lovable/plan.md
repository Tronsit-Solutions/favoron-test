

## Ocultar descripción en móvil

**Archivo:** `src/components/Dashboard.tsx` (línea 848)

Agregar `hidden sm:block` al `<p>` de la descripción para que solo se muestre en pantallas `sm` en adelante.

```tsx
<p className="text-muted-foreground text-sm sm:text-base hidden sm:block">
```

