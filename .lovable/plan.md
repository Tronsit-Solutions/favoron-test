

## Mejorar diseño de KPI Cards (Shoppers)

### Problema
Con 10 cards en una sola fila (`lg:grid-cols-10`), el texto se sale de los cuadros en pantallas normales. Palabras como "Monetizados", "Tasa Conversión" y "Costo Incidencias" no caben.

### Solucion

**`src/components/admin/cac/CACKPICards.tsx`**

1. Cambiar el grid de Shoppers de `grid-cols-2 md:grid-cols-5 lg:grid-cols-10` a `grid-cols-2 md:grid-cols-3 lg:grid-cols-5` para que las cards tengan 2 filas de 5 en desktop, dando mas espacio a cada una.

2. Agregar `truncate` al titulo de cada card y `min-w-0` a los contenedores flex para que el texto largo se corte con puntos suspensivos en vez de desbordarse.

3. Agregar `break-all` o `truncate` al valor grande para evitar desbordamiento en montos largos como "Q1885.87".

### Detalle del cambio en el JSX

```text
Grid Shoppers: grid-cols-2 md:grid-cols-3 lg:grid-cols-5
  - 2 filas de 5 cards en desktop
  - 3 columnas en tablet
  - 2 columnas en mobile

Titulo: agregar clase "truncate" al span del titulo
Contenedor titulo: agregar "min-w-0 overflow-hidden"
Valor: agregar "truncate"
Descripcion: agregar "truncate"
```

El grid de Viajeros (6 cards) se mantiene igual ya que funciona bien con `lg:grid-cols-6`.

