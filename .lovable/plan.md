

## Eliminar contenedor gris de detalles de dirección en TripCard

### Cambio
En `src/components/dashboard/TripCard.tsx`, línea 179, remover los estilos de fondo y borde del contenedor de información del viaje para que los detalles floten sin caja.

**Línea 179 actual:**
```
className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
```

**Cambiar a:**
```
className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors"
```

Se elimina `bg-muted/30`, `border`, y `border-border/50`. Se mantiene el hover sutil y el padding para que siga siendo clickeable cómodamente.

