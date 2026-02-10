

## Preview de etiquetas y 4 etiquetas por hoja

### Cambios

#### 1. Modal de preview antes de imprimir (`LabelCartBar.tsx`)

Al hacer clic en "Imprimir", en lugar de generar el PDF directamente, se abre un Dialog/modal con:

- Un grid de 2x2 mostrando previews de las etiquetas usando el componente `PackageLabel` (a escala reducida con `transform: scale()`)
- Paginacion visual: si hay mas de 4 etiquetas, mostrar indicador de paginas (ej. "Hoja 1 de 2")
- Boton "Descargar PDF" para confirmar la impresion
- Boton "Cancelar" para cerrar sin imprimir
- Posibilidad de remover etiquetas individuales del carrito con un boton X en cada preview

#### 2. Layout de 4 etiquetas por hoja en el PDF

Actualmente cada etiqueta ocupa una hoja completa (carta 612x792pt). Se cambiara a un layout de 2 columnas x 2 filas por hoja:

- Tamano de etiqueta en PDF: ~270x396pt (ligeramente reducida para caber con margenes)
- Posiciones en la hoja carta (612x792pt):
  - Superior izquierda: (18, 0)
  - Superior derecha: (324, 0)  
  - Inferior izquierda: (18, 396)
  - Inferior derecha: (324, 396)
- Nueva pagina cada 4 etiquetas

#### 3. Reducir tamano del componente `PackageLabel`

El componente `PackageLabel` actualmente es de 288x432px (4x6 pulgadas). Para que 4 quepan en una hoja carta, se reducira a aproximadamente **252x360px** (3.5x5 pulgadas), ajustando el padding y font-size proporcionalmente. Se agregara una prop `compact` para poder usar ambos tamanos.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/operations/LabelCartBar.tsx` | Separar el boton "Imprimir" para abrir un modal de preview. Crear el modal con grid 2x2 de etiquetas. Modificar la generacion de PDF para colocar 4 etiquetas por hoja. |
| `src/components/admin/PackageLabel.tsx` | Agregar prop `compact?: boolean` que reduce dimensiones para el layout de 4-por-hoja y para el preview en el modal. |

### Preview modal (detalle visual)

El modal mostrara las etiquetas agrupadas de 4 en 4, simulando como se veran en la hoja impresa:

- Fondo gris claro representando la hoja
- 4 etiquetas en grid 2x2 dentro de cada "hoja"
- Cada etiqueta con un boton X para removerla del carrito
- Footer del modal con: "X etiquetas en Y hojas" y boton "Descargar PDF"

