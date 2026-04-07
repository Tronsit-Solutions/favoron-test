

## Nueva pestaña: Pedidos Cancelados / Expirados en Customer Experience

### Objetivo
Agregar una tercera pestaña "Cancelados / Expirados" en la página de Customer Experience que muestre todos los paquetes con status `cancelled`, `quote_expired`, `quote_rejected`, y `deadline_expired`. El objetivo es entender por qué los usuarios no continuaron con su pedido.

### Cambios

**1. `src/hooks/useCustomerExperience.ts`** — Nuevo hook o extensión
- Crear un nuevo hook `useCancelledPackages()` que consulte paquetes con status IN (`cancelled`, `quote_expired`, `quote_rejected`, `deadline_expired`)
- Traer: `id`, `status`, `item_description`, `products_data`, `user_id`, `estimated_price`, `created_at`, `updated_at`, `rejection_reason`, `quote_rejection`, `traveler_rejection`, `package_destination`, `purchase_origin`, `delivery_deadline`
- Resolver perfiles de los shoppers (nombre, teléfono)
- Resolver viajero asignado si existe (`matched_trip_id` → trips → profiles)
- Ordenar por `updated_at` descendente
- Incluir filtro por status específico y búsqueda por nombre

**2. `src/pages/AdminCustomerExperience.tsx`**
- Agregar tercera pestaña "Cancelados" con icono `XCircle`
- Usar el nuevo hook dentro de un componente `CancelledTab`
- Mostrar stats: total, por cada sub-status (cancelled, quote_expired, etc.)
- Filtro por sub-status y búsqueda por nombre

**3. Nuevo componente `src/components/admin/cx/CancelledPackagesTable.tsx`**
- Tabla con columnas: Shopper, Producto, Status, Razón, Viajero asignado, Precio estimado, Fecha creación, Fecha cancelación/expiración
- Badge de color por status (cancelled=rojo, quote_expired=naranja, etc.)
- Mostrar `rejection_reason`, `quote_rejection.reason`, o `traveler_rejection.reason` según aplique como "Razón"
- Botón para ver detalle del paquete
- Sin funcionalidad de llamadas CX (es solo para análisis)

### Detalle técnico

```text
Statuses a incluir:
  - cancelled: el shopper canceló manualmente
  - quote_expired: el shopper no aceptó la cotización a tiempo
  - quote_rejected: el shopper rechazó la cotización
  - deadline_expired: la fecha límite pasó sin match

Columna "Razón" se extrae de:
  - rejection_reason (campo directo)
  - quote_rejection->reason (JSON)
  - traveler_rejection->reason (JSON)
  - Si ninguno existe: "Sin razón registrada"
```

