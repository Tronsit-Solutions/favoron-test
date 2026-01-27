
# Plan: Simplificar TripCard Eliminando Información Redundante

## Problema
Las tarjetas de viajes en el panel de matching muestran información redundante o innecesaria:
- **Teléfono** (📱): No es crítico para la vista previa
- **ID** (🆔): Información técnica innecesaria en preview
- **Status** (📋 approved): Redundante ya que están en la pestaña de viajes aprobados
- **Origen** (📍 Origen: Charleston, SC): Duplicado del título que ya dice "Charleston, SC → Guatemala City"

## Cambios Propuestos

### Archivo: `src/components/admin/matching/TripCard.tsx`

**Antes (líneas 36-54):**
```tsx
{/* Traveler contact info */}
<div className="space-y-1 text-xs text-muted-foreground mb-2">
  <div className="flex items-center space-x-3">
    <span>👤 {trip.first_name && trip.last_name 
      ? `${trip.first_name} ${trip.last_name}` 
      : trip.username || 'Usuario sin nombre'}</span>
    <span>📧 {trip.email || 'Sin email'}</span>
  </div>
  <div className="flex items-center space-x-3">
    <span>📱 {trip.phone_number || 'Sin teléfono'}</span>      <!-- ELIMINAR -->
    <span>🆔 {trip.user_id?.slice(0, 8)}...</span>             <!-- ELIMINAR -->
    <span>📋 {trip.status}</span>                              <!-- ELIMINAR -->
  </div>
  
  {/* Traveler origin city */}                                  <!-- ELIMINAR -->
  <div className="text-xs text-blue-600">                       <!-- ELIMINAR -->
    📍 Origen: {trip.from_city}                                 <!-- ELIMINAR -->
  </div>                                                        <!-- ELIMINAR -->
</div>
```

**Después:**
```tsx
{/* Traveler contact info */}
<div className="text-xs text-muted-foreground mb-2">
  <div className="flex items-center space-x-3">
    <span>👤 {trip.first_name && trip.last_name 
      ? `${trip.first_name} ${trip.last_name}` 
      : trip.username || 'Usuario sin nombre'}</span>
    <span>📧 {trip.email || 'Sin email'}</span>
  </div>
</div>
```

## Resultado Visual

**Antes:**
```
✈️ Charleston, SC → Guatemala City
👤 Bryan Gil  📧 bryangil19@gmail.com
📱 42379069  🆔 fd1f02d...  📋 approved
📍 Origen: Charleston, SC
💰 Total: $811.92
📅 Fecha de viaje: 27/1/2026
...
```

**Después (limpio):**
```
✈️ Charleston, SC → Guatemala City
👤 Bryan Gil  📧 bryangil19@gmail.com
💰 Total: $811.92
📅 Fecha de viaje: 27/1/2026
...
```

## Impacto
- **Visual:** Tarjetas más limpias y fáciles de leer
- **UX:** Información esencial sin ruido
- **Riesgo:** Ninguno - la información completa sigue disponible al hacer clic en "Ver"
