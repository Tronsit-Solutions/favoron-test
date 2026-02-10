

## Nueva pestana "Buscar" en el Panel de Operaciones

### Objetivo

Agregar una 5ta pestana al panel de operaciones que funcione como buscador universal de pedidos. Debe incluir pedidos completados y todos los pedidos posteriores al estado "paid", permitiendo buscar por multiples criterios.

### Criterios de busqueda

- ID del pedido (parcial o completo)
- Nombre y apellido del shopper
- Nombre/descripcion del pedido (item_description)
- Numero de etiqueta (label_number)

### Cambios tecnicos

| Archivo | Cambio |
|---------|--------|
| `src/components/operations/OperationsSearchTab.tsx` | **Nuevo componente.** Contiene una barra de busqueda con input de texto y logica de busqueda. Hace query directa a Supabase (no usa el RPC existente que excluye `completed`). Muestra resultados en cards similares a las otras pestanas, con badge de estado y datos del pedido. |
| `src/pages/Operations.tsx` | Agregar la 5ta pestana "Buscar" con icono de lupa. Cambiar el grid de `grid-cols-4` a `grid-cols-5`. Renderizar `OperationsSearchTab`. |

### Detalle de implementacion

**1. OperationsSearchTab**

- Input de busqueda con debounce de 300ms para no hacer queries en cada tecla
- Query a Supabase solo cuando el termino tiene al menos 2 caracteres
- La query busca en la tabla `packages` con JOIN a `profiles` (shopper) y `trips` + `profiles` (traveler)
- Filtra por estados posteriores a pagado: `paid`, `pending_purchase`, `purchased`, `in_transit`, `received_by_traveler`, `pending_office_confirmation`, `delivered_to_office`, `ready_for_pickup`, `ready_for_delivery`, `completed`
- Usa `.or()` de Supabase para buscar en multiples campos simultaneamente
- Para buscar por `label_number`, convierte el termino de busqueda a numero si es posible
- Limite de 50 resultados para mantener performance
- Muestra estado vacio cuando no hay busqueda activa ("Escribe para buscar pedidos")
- Muestra estado vacio cuando no hay resultados ("No se encontraron pedidos")

**2. Resultado de busqueda (card)**

Cada resultado muestra:
- Numero de etiqueta (si tiene)
- Badge con el estado actual del pedido (con color segun estado)
- Nombre del shopper
- Descripcion del pedido / productos
- Nombre del viajero asignado (si tiene)
- Ruta del viaje (origen - destino)
- Fecha de creacion

**3. Query de busqueda**

La busqueda se hace directamente a la DB (no al RPC) porque necesita incluir pedidos `completed`:

```sql
SELECT p.*, 
  shopper.first_name, shopper.last_name,
  t.from_city, t.to_city, traveler.first_name, traveler.last_name
FROM packages p
LEFT JOIN profiles shopper ON shopper.id = p.user_id
LEFT JOIN trips t ON t.id = p.matched_trip_id  
LEFT JOIN profiles traveler ON traveler.id = t.user_id
WHERE p.status IN ('paid','pending_purchase','purchased','in_transit',
  'received_by_traveler','pending_office_confirmation','delivered_to_office',
  'ready_for_pickup','ready_for_delivery','completed')
AND (
  p.id::text ILIKE '%term%'
  OR p.item_description ILIKE '%term%'
  OR shopper.first_name ILIKE '%term%'
  OR shopper.last_name ILIKE '%term%'
  OR p.label_number = term_as_number
)
ORDER BY p.created_at DESC
LIMIT 50
```

Como Supabase JS no soporta ILIKE en JOINs directamente, se creara un RPC `search_operations_packages` que ejecuta esta query parametrizada.

**4. Migracion SQL**

Crear funcion RPC `search_operations_packages(search_term text)` que recibe el termino de busqueda y retorna los resultados con los JOINs necesarios, incluyendo busqueda por nombre completo (first_name || ' ' || last_name).

### Pestana en la UI

La pestana se muestra con:
- Icono: `Search` de lucide-react
- Texto: "Buscar"
- Sin badge de contador (ya que es un buscador bajo demanda)
