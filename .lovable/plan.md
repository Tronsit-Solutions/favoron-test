

## Persistir carrito de etiquetas y agregar historial de lotes

### Problema
El carrito de etiquetas usa `useState` en memoria. Cuando la pagina se recarga (por suscripciones realtime u otras causas), las etiquetas acumuladas se pierden y no hay forma de recuperarlas.

### Solucion en 2 partes

---

### Parte 1: Persistir el carrito en localStorage

**Archivo: `src/hooks/useOperationsData.tsx`**

- Cambiar `useState<LabelCartItem[]>([])` por una version que lea/escriba en `localStorage` bajo la llave `"ops_label_cart"`.
- Al inicializar, leer del localStorage. En cada cambio al carrito, escribir al localStorage.
- Esto asegura que si la pagina se recarga, el carrito sigue intacto.

---

### Parte 2: Historial de lotes de etiquetas

**Archivo: `src/hooks/useOperationsData.tsx`**

- Agregar un nuevo estado `labelHistory` que almacena los ultimos N lotes (ej. 20) en localStorage bajo `"ops_label_history"`.
- Cada lote tiene: `id`, `createdAt`, `items[]` (las etiquetas del lote).
- Cuando se descarga el PDF (al llamar `clearLabelCart`), mover el lote actual al historial antes de limpiar.
- Exponer `labelHistory`, `restoreFromHistory(batchId)`, y `deleteFromHistory(batchId)`.

**Archivo: `src/components/operations/LabelCartBar.tsx`**

- Agregar un boton "Historial" en la barra flotante o junto al boton de imprimir.
- En el dialog de preview, agregar una pestana o seccion "Historial" que muestre los lotes anteriores con:
  - Fecha/hora del lote
  - Cantidad de etiquetas
  - Boton "Restaurar" para cargar ese lote al carrito actual
  - Boton "Eliminar" para borrar del historial
- Cuando se restaura un lote, se carga al carrito y se abre el preview para reimprimir.

---

### Estructura de datos del historial

```text
interface LabelBatch {
  id: string;          // generado con crypto.randomUUID()
  createdAt: string;   // ISO timestamp
  items: LabelCartItem[];
}
```

Almacenado en localStorage como array JSON, maximo 20 lotes (los mas antiguos se eliminan automaticamente).

---

### Archivos a modificar

1. `src/hooks/useOperationsData.tsx` - Persistir carrito + historial en localStorage
2. `src/components/operations/LabelCartBar.tsx` - UI del historial
3. `src/pages/Operations.tsx` - Pasar props de historial al LabelCartBar

