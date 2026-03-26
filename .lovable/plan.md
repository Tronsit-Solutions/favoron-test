

## Agregar contenedor de asignaciones (package_assignments) al modal del viajero

### Problema
El contenedor "Paquetes en este Viaje" actual muestra 0 porque filtra por estados muy específicos y timers activos. El usuario necesita ver **todas** las asignaciones de `package_assignments` para ese viaje con su estado de bid real.

### Solución
Agregar una nueva sección debajo del contenedor actual que consulte directamente `package_assignments` por `trip_id` y muestre cada asignación con su estado de bid (`bid_pending`, `bid_submitted`, `bid_won`, `bid_lost`, `bid_expired`, `bid_cancelled`).

### Cambios en `src/components/admin/AdminMatchDialog.tsx`

1. **Nuevo estado**: `tripAssignments` para almacenar las asignaciones raw de `package_assignments` con join a `packages` y `profiles`.

2. **Nueva query** en el efecto de `showTravelerInfo`: Consultar `package_assignments` con `trip_id = trip.id` sin filtro de status, haciendo join a packages para obtener `item_description`, `estimated_price`, `purchase_origin`, `package_destination` y al perfil del shopper.

3. **Nueva Card** debajo de "Paquetes en este Viaje": 
   - Título: "Asignaciones del Viaje (N)"
   - Lista cada asignación mostrando:
     - Descripción del producto
     - Ruta (origen → destino)
     - Shopper name
     - Precio estimado
     - **Badge con estado del bid** con colores diferenciados:
       - `bid_pending` → amarillo
       - `bid_submitted` → azul
       - `bid_won` → verde
       - `bid_lost` → rojo
       - `bid_expired` → gris
       - `bid_cancelled` → gris oscuro

### Detalle técnico

```
Query:
supabase
  .from('package_assignments')
  .select(`
    id, package_id, status, admin_assigned_tip, quote, created_at,
    packages:package_id (id, item_description, estimated_price, purchase_origin, package_destination, user_id, profiles:user_id (first_name, last_name, username))
  `)
  .eq('trip_id', trip.id)
  .order('created_at', { ascending: false })
```

Badge mapping:
```
bid_pending    → variant="warning"   "Pendiente"
bid_submitted  → variant="default" (blue)  "Cotización Enviada"  
bid_won        → variant="success"  "Ganada"
bid_lost       → variant="destructive" "Perdida"
bid_expired    → variant="secondary" "Expirada"
bid_cancelled  → variant="secondary" "Cancelada"
```

### Archivo a modificar
- `src/components/admin/AdminMatchDialog.tsx`

