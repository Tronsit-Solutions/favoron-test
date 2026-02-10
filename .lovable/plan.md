

## Carrito de Etiquetas en el Panel de Operaciones

### Concepto

Crear un "carrito" persistente de etiquetas que se llena automaticamente cada vez que el operario confirma la recepcion de un paquete. El carrito se muestra como una barra flotante en la parte inferior de la pantalla con un contador. Cuando el operario decide imprimir, se genera un PDF con todas las etiquetas acumuladas y el carrito se vacia.

### Flujo del operario

```text
1. Operario confirma paquete A --> etiqueta A se agrega al carrito (badge: 1)
2. Operario confirma paquete B --> etiqueta B se agrega al carrito (badge: 2)
3. Operario confirma paquetes C, D, E (todos) --> se agregan al carrito (badge: 5)
4. Operario hace clic en "Imprimir 5 etiquetas" --> PDF se descarga, carrito se vacia
```

### Cambios tecnicos

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useOperationsData.tsx` | Agregar estado `labelCart` (array de paquetes con su `label_number`), funciones `addToLabelCart`, `addManyToLabelCart`, `clearLabelCart`, `removeFromLabelCart`. Los datos del paquete confirmado se re-obtienen de la DB (con el `label_number` asignado por el RPC) antes de agregarse al carrito. |
| `src/components/operations/OperationsReceptionTab.tsx` | Despues de cada confirmacion exitosa, llamar `addToLabelCart` o `addManyToLabelCart` con los datos del paquete confirmado. Renderizar la barra flotante del carrito en la parte inferior. |
| `src/components/operations/LabelCartBar.tsx` | **Nuevo componente.** Barra flotante `fixed bottom-0` que muestra: icono de etiqueta, contador de etiquetas, boton "Imprimir X etiquetas", boton "Vaciar". Al imprimir, reutiliza la logica de `generateTripLabels` de `OperationsLabelsTab` (html2canvas + jsPDF + PackageLabel). |
| `src/pages/Operations.tsx` | Pasar las funciones del carrito desde `useOperationsData` al tab de Recepcion y renderizar `LabelCartBar` de forma global (visible en cualquier tab). |

### Detalle de implementacion

**1. Estado del carrito en `useOperationsData`**

Se agrega un array `labelCart` con la informacion minima necesaria para renderizar `PackageLabel`:

- `id`, `item_description`, `products_data`, `confirmed_delivery_address`, `delivery_method`, `label_number`, `shopper_name`, `estimated_price`, `created_at`
- Datos del viaje asociado: `trip_from_city`, `trip_to_city`, `traveler_name`

Tras una confirmacion exitosa, se hace una query rapida para obtener el `label_number` recien asignado:

```typescript
const { data } = await supabase
  .from('packages')
  .select('label_number')
  .eq('id', packageId)
  .single();
```

**2. Barra flotante (LabelCartBar)**

Componente fijo en la parte inferior de la pantalla:

- Cuando el carrito esta vacio: no se muestra
- Cuando tiene etiquetas: muestra barra con fondo primario, icono Tag, texto "X etiqueta(s) listas", boton "Imprimir" y boton "Vaciar"
- El boton "Imprimir" genera el PDF reutilizando la misma logica de `OperationsLabelsTab.generateTripLabels` (html2canvas + jsPDF + PackageLabel)
- Animacion de entrada suave cuando aparece la primera etiqueta

**3. Flujo de confirmacion modificado en ReceptionTab**

En `handleConfirmPackage`: tras el exito del RPC, obtener el `label_number` del paquete y llamar `addToLabelCart(packageData)`.

En `handleConfirmAll`: tras confirmar multiples paquetes, obtener los `label_number` de todos y llamar `addManyToLabelCart(packagesData)`.

**4. Persistencia**

El carrito vive solo en memoria (useState). Si el operario recarga la pagina, el carrito se pierde. Esto es intencional: evita imprimir etiquetas duplicadas accidentalmente. Si se desea persistencia entre recargas, se puede usar `localStorage` en una iteracion futura.

### Resultado esperado

El operario confirma paquetes y ve un contador creciendo en la barra inferior. Cuando termina de confirmar un lote, presiona "Imprimir" y obtiene un PDF con todas las etiquetas. El flujo pasa de 3 pasos (Recepcion, Preparacion, Etiquetas) a un flujo continuo dentro de Recepcion.

