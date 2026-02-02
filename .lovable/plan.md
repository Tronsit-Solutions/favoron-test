
# Plan: Agregar País de Destino a EditPackageModal (Shopper)

## Problema Identificado

El modal de edición de paquetes para shoppers (`EditPackageModal.tsx`) no permite seleccionar ni guardar el país de destino:

1. Solo hay estado para `packageDestination` (ciudad), no para el país
2. El selector de destino está hardcodeado con solo ciudades de Guatemala
3. La función `handleSave` no incluye `package_destination_country`

## Solución

### Cambios en `src/components/dashboard/EditPackageModal.tsx`

#### 1. Agregar estado para país (línea ~90)

```typescript
const [packageDestination, setPackageDestination] = useState(pkg.package_destination || "");
const [packageDestinationCountry, setPackageDestinationCountry] = useState(pkg.package_destination_country || "Guatemala"); // NUEVO
```

#### 2. Agregar lista de países y ciudades dinámicas (~línea 95)

```typescript
const destinationCountries = [
  { value: 'Guatemala', label: 'Guatemala' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'España', label: 'España' },
  { value: 'México', label: 'México' },
  { value: 'Otro', label: 'Otro país' }
];

const citiesByCountry: Record<string, string[]> = {
  'Guatemala': ['Cualquier ciudad', 'Guatemala City', 'Antigua Guatemala', 'Quetzaltenango', 'Escuintla', 'Otra ciudad'],
  'Estados Unidos': ['Cualquier ciudad', 'Miami', 'New York', 'Los Angeles', 'Houston', 'Chicago', 'Otra ciudad'],
  'España': ['Cualquier ciudad', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Otra ciudad'],
  'México': ['Cualquier ciudad', 'Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Otra ciudad'],
  'Otro': ['Cualquier ciudad', 'Otra ciudad']
};
```

#### 3. Reset país en useEffect (línea ~111)

```typescript
setPackageDestination(pkg.package_destination || "");
setPackageDestinationCountry(pkg.package_destination_country || "Guatemala"); // NUEVO
```

#### 4. Incluir país en handleSave (línea ~142)

```typescript
if (canEditDestination) {
  updatedData.package_destination = packageDestination;
  updatedData.package_destination_country = packageDestinationCountry; // NUEVO
}
```

#### 5. Actualizar UI del selector de destino (líneas 296-320)

Reemplazar el selector actual con dos selectores (país + ciudad):

```tsx
{/* País de Destino */}
<div className="space-y-2 mb-3">
  <Label className="text-xs text-muted-foreground">País de destino</Label>
  <Select 
    value={packageDestinationCountry} 
    onValueChange={(value) => {
      setPackageDestinationCountry(value);
      setPackageDestination(""); // Reset ciudad al cambiar país
    }}
    disabled={!canEditDestination}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecciona el país" />
    </SelectTrigger>
    <SelectContent>
      {destinationCountries.map(country => (
        <SelectItem key={country.value} value={country.value}>
          {country.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

{/* Ciudad de Destino */}
<div className="space-y-2">
  <Label className="text-xs text-muted-foreground">Ciudad de destino</Label>
  <Select 
    value={packageDestination} 
    onValueChange={setPackageDestination}
    disabled={!canEditDestination || !packageDestinationCountry}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecciona la ciudad" />
    </SelectTrigger>
    <SelectContent>
      {(citiesByCountry[packageDestinationCountry] || []).map(city => (
        <SelectItem key={city} value={city}>
          {city}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

## Resumen de Cambios

| Línea | Cambio |
|-------|--------|
| ~90 | Agregar estado `packageDestinationCountry` |
| ~95 | Agregar constantes de países y ciudades |
| ~111 | Resetear país en useEffect |
| ~142 | Incluir país en `updatedData` |
| 296-320 | Reemplazar selector con país + ciudad dinámicos |

## Resultado

- El shopper podrá seleccionar país y ciudad de destino
- Al guardar, ambos campos se persistirán en la base de datos
- Consistente con el flujo del admin en `PackageDetailModal.tsx`
