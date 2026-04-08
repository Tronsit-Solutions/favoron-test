

## Ajustes al Preview Card de Mis Pedidos (Mobile)

### Cambios

**`src/components/dashboard/CollapsiblePackageCard.tsx`**

1. **Título en 1 línea con truncado** (línea 465-470): Cambiar `line-clamp-2` a `truncate` y agregar `text-left` para alinear a la izquierda. El título se cortará con "..." si es largo.

2. **Botones a ancho completo** (líneas 630-712): Los botones ya tienen `w-full`, pero el contenedor padre tiene `pr-8` que limita el ancho. Se eliminará el `pr-8` del contenedor principal (línea 463) para que los botones ocupen todo el ancho de la card.

3. **Chat flotante** (líneas 718-730): Mover el botón de chat fuera del flex-row y posicionarlo como `absolute` en la esquina inferior derecha de la card, similar al menú de tres puntos que ya flota en la esquina superior derecha.

### Detalle técnico

```
Estructura actual:
┌─────────────────────────────┐
│ [...]  (absolute top-right) │
│ [Título largo del pedi...]  │
│ ID: abc12345                │
│ [Botones-----] [Chat]      │
└─────────────────────────────┘

Estructura nueva:
┌─────────────────────────────┐
│ [...]  (absolute top-right) │
│ Título largo del ped...     │
│ ID: abc12345                │
│ [Botones ancho completo---] │
│              [Chat] floating│
└─────────────────────────────┘
```

**Cambios específicos:**

- **Línea 463**: Quitar `pr-8` → solo `flex flex-col gap-2 flex-1 min-w-0`
- **Línea 461**: Cambiar `flex flex-row gap-2` → quitar el gap ya que chat será absolute
- **Línea 465-470**: Título con `truncate` en vez de `line-clamp-2`, agregar `text-left`
- **Líneas 718-730**: Mover el botón de chat a posición `absolute bottom-2 right-2` con un `z-10`, fuera del flex-row
- Agregar `relative` al contenedor padre para que el absolute del chat funcione correctamente

