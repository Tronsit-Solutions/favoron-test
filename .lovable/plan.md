

## Desglosar confirmacion de oficina por producto individual

### Problema actual
El indicador de confirmacion de oficina (check verde / reloj naranja) se muestra a nivel de **paquete** en el header. Cuando un paquete tiene multiples productos, no se puede ver cual producto fue recibido y cual no.

### Solucion

**Archivo**: `src/components/admin/AdminTravelerPaymentsTab.tsx`

### Cambios

**1. Mover el check al nivel de producto individual (multi-producto)**

Para paquetes con multiples productos (lineas 664-681), agregar un checkbox/icono a la **izquierda** de cada producto individual usando los campos `receivedAtOffice` y `notArrived` del `products_data`:

- `receivedAtOffice === true` -> CheckCircle verde
- `notArrived === true` -> X rojo  
- Ninguno de los dos -> Clock naranja (pendiente)

Eliminar el icono de confirmacion del header del paquete (lineas 651-661) ya que ahora se muestra por producto.

**2. Para paquetes de un solo producto (lineas 707-730)**

Mover el icono de confirmacion a la **izquierda** de la fila, antes del icono de Package, para mantener alineacion vertical consistente con los multi-producto.

**3. Layout actualizado por producto**

Cada fila de producto tendra esta estructura:
```
[CheckIcon] • Nombre del producto                    Q20.00
```

El icono de check estara alineado a la izquierda, antes del bullet point, reemplazando la posicion actual (que estaba a la derecha junto al nombre).

### Resultado visual esperado

Para un paquete con 4 productos:
```
[Package] Pedido de 4 productos: Creatina, Vitaminas...
  [check] • Creatina                                 Q20.00
  [check] • Vitaminas                                Q25.00
  [reloj] • Vitaminas                                Q20.00
  [reloj] • libro                                    Q10.00
```

Para un paquete simple:
```
[check] [Package] Nombre del producto                Q120.00
```

