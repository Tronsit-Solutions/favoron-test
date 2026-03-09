

## Optimizar TripCard para móvil: Tips flotante a la derecha

Mirando la screenshot, el card tiene espacio libre a la derecha del contenido principal. La idea es reorganizar el layout para que el botón de Tips flote en ese espacio, aprovechando mejor el ancho.

### Cambios en `src/components/dashboard/TripCard.tsx`

**Nuevo layout del CardHeader:**

```text
┌─────────────────────────────────────────┐
│ [Route: City → City]          [...menu] │
│ ID: e36e26aa                            │
│ [⭐ Califica tu experiencia]    [Tips]  │
│ [Status Badge ──────────────>]          │
└─────────────────────────────────────────┘
```

Cambiar a un layout de 2 columnas dentro del CardHeader:
- **Columna izquierda** (`flex-1`): ruta + ID + survey/delivery buttons + status badge
- **Columna derecha** (`flex-shrink-0`, alineada verticalmente al centro): botón Tips

Esto posiciona el botón Tips flotando en el espacio libre a la derecha del contenido, en vez de ocupar una fila completa abajo.

### Detalle técnico

1. Envolver el contenido del CardHeader en `flex flex-row` en vez de solo `flex-col`
2. Mover el botón Tips fuera del bloque "Status Badge and Tips" y colocarlo como elemento hermano derecho del contenido principal
3. El status badge queda solo en su fila inferior izquierda
4. El botón Tips se muestra con orientación vertical o compacto, alineado al centro-derecha del card

