
# Plan: Agregar soporte para mostrar viajes a otras ciudades de España

## Problema Actual
Cuando un paquete tiene destino "Barcelona" (España):
- Solo se muestran viajes que van exactamente a Barcelona
- No se ofrece opción de ver viajes a Madrid, Valencia, Sevilla u otras ciudades españolas
- La lógica de "otras ciudades" solo existe para Guatemala y USA

## Solución
Agregar `otherSpainCityTrips` con la misma estructura que `otherUSCityTrips`.

## Cambios Técnicos

### Archivo: `src/components/admin/AdminMatchDialog.tsx`

**1. Agregar lista de ciudades españolas (después de línea 314)**

```typescript
// Count trips to OTHER cities in Spain
const otherSpainCityTrips = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const packageOriginNormalized = normalizeCountry(selectedPackage?.purchase_origin || '');
  const packageDestinationCity = selectedPackage?.package_destination?.toLowerCase().trim() || '';
  
  // Spanish cities
  const spainCities = ['madrid', 'barcelona', 'valencia', 'sevilla', 'zaragoza', 
                       'málaga', 'malaga', 'murcia', 'palma', 'bilbao', 
                       'alicante', 'córdoba', 'cordoba', 'valladolid'];
  
  // Check if package destination is in Spain
  const packageDestNormalized = normalizeCountry(selectedPackage?.package_destination || '');
  const isPackageToSpain = packageDestNormalized === 'espana' || 
                           spainCities.some(city => packageDestinationCity.includes(city));
  
  if (!isPackageToSpain) return [];
  
  return availableTrips.filter(trip => {
    const isNotExpired = new Date(trip.arrival_date) >= today;
    const tripOriginNormalized = normalizeCountry(trip.from_country || '');
    const tripDestinationCity = trip.to_city?.toLowerCase().trim() || '';
    const tripDestNormalized = normalizeCountry(trip.to_city || '');
    
    // Same origin country
    const matchesOrigin = tripOriginNormalized === packageOriginNormalized;
    
    // Trip goes to Spain
    const tripToSpain = tripDestNormalized === 'espana' ||
                        trip.to_country?.toLowerCase().includes('españa') ||
                        trip.to_country?.toLowerCase().includes('espana') ||
                        spainCities.some(city => tripDestinationCity.includes(city));
    
    // Different city
    const differentCity = tripDestinationCity !== packageDestinationCity;
    
    return isNotExpired && matchesOrigin && tripToSpain && differentCity;
  }).sort((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime());
}, [availableTrips, selectedPackage?.purchase_origin, selectedPackage?.package_destination]);
```

**2. Actualizar la UI para mostrar el toggle de España**

Agregar después del bloque de `otherUSCityTrips.length > 0`:

```typescript
{otherSpainCityTrips.length > 0 && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setShowOtherCities(!showOtherCities)}
    className="text-xs text-muted-foreground hover:text-primary"
  >
    {showOtherCities ? 'Ocultar' : `Ver ${otherSpainCityTrips.length} viajes a otras ciudades de España`}
    <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showOtherCities ? 'rotate-180' : ''}`} />
  </Button>
)}
```

**3. Incluir viajes de España en la lista expandida**

Actualizar la condición de viajes a mostrar:
```typescript
// Cuando showOtherCities está activo, incluir también viajes de España
const tripsToShow = showOtherCities 
  ? [...validTrips, ...otherCityTrips, ...otherUSCityTrips, ...otherSpainCityTrips]
  : validTrips;
```

## Resultado Esperado

| Destino del paquete | Viajes mostrados |
|---------------------|------------------|
| Barcelona | Viajes a Barcelona + opción "Ver X viajes a otras ciudades de España" |
| Madrid | Viajes a Madrid + opción expandible |

```
Antes:
┌─────────────────────────────────────┐
│ Viajes Disponibles (1)              │
│ Frances Díaz → Barcelona            │
│ (Sin opción de ver Madrid)          │
└─────────────────────────────────────┘

Después:
┌─────────────────────────────────────┐
│ Viajes Disponibles (1)              │
│ Frances Díaz → Barcelona            │
│                                     │
│ [Ver 2 viajes a otras ciudades      │
│  de España ▼]                       │
│                                     │
│ (Expandido:)                        │
│ Juan → Madrid                       │
│ Ana → Valencia                      │
└─────────────────────────────────────┘
```
