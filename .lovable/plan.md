

# Plan: Eliminar Email del TripCard

## Cambio Requerido

Eliminar el span con el email del viajero de la tarjeta de viaje.

### Archivo: `src/components/admin/matching/TripCard.tsx`

**Líneas 36-44 - Antes:**
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

**Después:**
```tsx
{/* Traveler name */}
<div className="text-xs text-muted-foreground mb-2">
  <span>👤 {trip.first_name && trip.last_name 
    ? `${trip.first_name} ${trip.last_name}` 
    : trip.username || 'Usuario sin nombre'}</span>
</div>
```

## Resultado Visual

```
✈️ Charleston, SC → Guatemala City
👤 Bryan Gil
💰 Total: $811.92
📅 Fecha de viaje: 27/1/2026
...
```

## Impacto
- Tarjeta más limpia con solo el nombre del viajero
- Email disponible al hacer clic en "Ver" para ver detalles completos

