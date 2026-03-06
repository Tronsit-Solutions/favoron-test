

## Rediseñar botón de tips en TripCard

### Cambio

**`src/components/dashboard/TripCard.tsx` (líneas 226-234)**

Cambiar el botón actual (variant="outline" con icono Banknote) por un estilo similar al botón de chat:
- Usar `rounded-full` con fondo suave (`bg-green-100 hover:bg-green-200`)
- Reemplazar el icono `Banknote` por el emoji `🫰`
- Mantener el monto al lado
- Quitar el import de `Banknote` si ya no se usa en otro lugar

**Antes:**
```tsx
<Button size="sm" variant="outline" className="h-8 px-3 text-xs">
  <Banknote className="h-3 w-3 mr-1" />
  <span>{formatCurrency(tipsAmount)}</span>
</Button>
```

**Después:**
```tsx
<Button size="sm" variant="ghost" className="h-10 px-3 bg-green-100 hover:bg-green-200 rounded-full text-xs gap-1">
  <span className="text-base">🫰</span>
  <span className="font-medium text-green-800">{formatCurrency(tipsAmount)}</span>
</Button>
```

