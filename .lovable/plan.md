
# Plan: Timeline de Actividad Detallada para Feedback

## Objetivo
Crear una nueva pestaña "Timeline" en el Centro de Reportes que muestre **cada acción individual** de usuarios activos, con información de contexto para facilitar el seguimiento y feedback.

## Diseño de la Vista

### Estructura de cada línea

**Para Viajeros:**
| Usuario | WhatsApp | Acción | Detalle | Fecha | Estado | Paquetes |
|---------|----------|--------|---------|-------|--------|----------|
| José Pérez | 📱 55123456 | Registró viaje | Houston → Guatemala | 15 Ene 2026 | Completado y Pagado ✅ | 4 pagados, 0 pendientes |

**Para Shoppers:**
| Usuario | WhatsApp | Acción | Detalle | Fecha | Estado | Monto |
|---------|----------|--------|---------|-------|--------|-------|
| Andrea Ortiz | 📱 42987654 | Creó solicitud | Botas UGG + Perfume | 20 Ene 2026 | Cancelado ❌ | Q175 |
| María López | 📱 31234567 | Creó solicitud | iPhone case | 18 Ene 2026 | Completado ✅ | Q250 |

### Filtros disponibles
- **Tipo de acción**: Viajes / Solicitudes / Todos
- **Estado**: Completados / Cancelados / En proceso / Todos
- **Rango de fechas**: Último mes, últimos 3 meses, personalizado
- **Búsqueda**: Por nombre, email o teléfono

### Información clave por tipo

**Viajes:**
- Nombre completo + WhatsApp (link directo)
- Ruta: origen → destino
- Fecha de registro
- Estado del viaje (aprobado, completado, etc.)
- Paquetes: X confirmados (pagados), Y completados
- Indicador si cobró o tiene pago pendiente

**Solicitudes (Packages):**
- Nombre completo + WhatsApp (link directo)
- Descripción del producto
- Fecha de solicitud
- Estado actual (quote_sent, payment_confirmed, completed, cancelled, etc.)
- Monto total (si pagó)
- Indicador: Pagó ✅ / No pagó ❌ / Pendiente ⏳

## Archivos a Crear/Modificar

### 1. Nuevo Hook: `src/hooks/useActivityTimeline.tsx`
```typescript
// Estructura de datos
interface ActivityItem {
  id: string;
  type: 'trip' | 'package';
  userId: string;
  userName: string;
  userPhone: string | null;
  userEmail: string | null;
  
  // Detalles específicos
  description: string;      // "Houston → Guatemala" o "Botas UGG"
  createdAt: string;
  status: string;
  statusLabel: string;      // "Completado y Pagado"
  
  // Métricas
  amount?: number;          // Monto pagado (packages)
  confirmedPackages?: number; // Para viajes
  completedPackages?: number; // Para viajes
  hasPendingPayment?: boolean; // Para viajes
  paid?: boolean;           // Para packages
}
```

### 2. Nuevo Componente: `src/components/admin/ActivityTimelineTab.tsx`
- Tabla con columnas: Usuario, WhatsApp, Tipo, Detalle, Fecha, Estado, Info Extra
- Filtros por tipo, estado, fecha
- Búsqueda por nombre/teléfono
- Export a Excel con toda la data
- Link directo a WhatsApp en cada fila

### 3. Modificar: `src/pages/AdminReports.tsx`
- Agregar nueva pestaña "Timeline" con icono de reloj

## Queries SQL necesarias

**Para Viajes:**
```sql
SELECT 
  t.id, t.from_city, t.to_city, t.status, t.created_at,
  pr.first_name, pr.last_name, pr.phone_number, pr.email,
  COUNT(CASE WHEN p.status IN ('payment_confirmed','pending_purchase','in_transit','received_by_traveler','pending_office_confirmation','delivered_to_office','completed') THEN 1 END) as confirmed_packages,
  COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_packages,
  tpa.payment_order_created
FROM trips t
JOIN profiles pr ON t.user_id = pr.id
LEFT JOIN packages p ON p.matched_trip_id = t.id
LEFT JOIN trip_payment_accumulator tpa ON tpa.trip_id = t.id
WHERE t.status NOT IN ('pending_approval', 'rejected')
GROUP BY t.id, pr.id, tpa.payment_order_created
```

**Para Solicitudes:**
```sql
SELECT 
  p.id, p.item_description, p.status, p.created_at,
  p.quote->>'totalPrice' as total_price,
  pr.first_name, pr.last_name, pr.phone_number, pr.email,
  CASE WHEN p.status IN ('payment_confirmed','pending_purchase','in_transit','received_by_traveler','pending_office_confirmation','delivered_to_office','completed') THEN true ELSE false END as paid
FROM packages p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.status NOT IN ('pending_approval')
```

## Estados a mostrar (con colores)

### Viajes:
| Estado | Etiqueta | Color |
|--------|----------|-------|
| approved | Aprobado - Sin paquetes | 🟡 Amarillo |
| approved + packages | Aprobado - Con paquetes | 🔵 Azul |
| completed + paid | Completado y Pagado | 🟢 Verde |
| completed + pending payment | Completado - Pago Pendiente | 🟠 Naranja |

### Solicitudes:
| Estado | Etiqueta | Color |
|--------|----------|-------|
| quote_sent | Cotización enviada | 🟡 Amarillo |
| quote_accepted | Cotización aceptada - No ha pagado | 🟠 Naranja |
| payment_confirmed | Pagado - En proceso | 🔵 Azul |
| completed | Completado | 🟢 Verde |
| cancelled | Cancelado | 🔴 Rojo |

## Resultado Final

Una tabla interactiva donde podrás:
1. Ver cronológicamente todas las acciones de usuarios
2. Filtrar por tipo (viaje/solicitud) y estado
3. Hacer clic en WhatsApp para contactar directamente
4. Ver de un vistazo si pagaron o no
5. Exportar a Excel para análisis offline

## Pasos de Implementación

1. Crear el hook `useActivityTimeline.tsx` con las queries y procesamiento
2. Crear el componente `ActivityTimelineTab.tsx` con la tabla y filtros
3. Agregar la nueva pestaña en `AdminReports.tsx`
4. Probar filtros y exportación
