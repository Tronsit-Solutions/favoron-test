
# Plan: Dropdown de Municipios para Entrega a Domicilio

## Objetivo
Reemplazar el campo de texto "Ciudad/Municipio" por un dropdown con los municipios del área metropolitana de Guatemala. Esto resolverá el bug de delivery fee (Nicole Berger) al estandarizar los valores.

## Municipios a incluir

### Guatemala Ciudad (Q25 delivery)
- Ciudad de Guatemala

### Municipios periféricos (Q60 delivery)
- Mixco
- Villa Nueva
- San Miguel Petapa
- Villa Canales
- Amatitlán
- Santa Catarina Pinula
- San José Pinula
- Fraijanes
- Chinautla
- Palencia
- San Pedro Ayampuc
- San Juan Sacatepéquez

## Archivos a modificar

### 1. `src/lib/cities.ts`
Agregar nueva constante con municipios de Guatemala:

```typescript
export const GUATEMALA_MUNICIPALITIES = [
  { value: 'Ciudad de Guatemala', label: 'Ciudad de Guatemala', isCapital: true },
  { value: 'Mixco', label: 'Mixco', isCapital: false },
  { value: 'Villa Nueva', label: 'Villa Nueva', isCapital: false },
  { value: 'San Miguel Petapa', label: 'San Miguel Petapa', isCapital: false },
  { value: 'Villa Canales', label: 'Villa Canales', isCapital: false },
  { value: 'Amatitlán', label: 'Amatitlán', isCapital: false },
  { value: 'Santa Catarina Pinula', label: 'Santa Catarina Pinula', isCapital: false },
  { value: 'San José Pinula', label: 'San José Pinula', isCapital: false },
  { value: 'Fraijanes', label: 'Fraijanes', isCapital: false },
  { value: 'Chinautla', label: 'Chinautla', isCapital: false },
  { value: 'Palencia', label: 'Palencia', isCapital: false },
  { value: 'San Pedro Ayampuc', label: 'San Pedro Ayampuc', isCapital: false },
  { value: 'San Juan Sacatepéquez', label: 'San Juan Sacatepéquez', isCapital: false },
];
```

### 2. `src/components/AddressForm.tsx`
Cambiar el Input por un Select:

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GUATEMALA_MUNICIPALITIES } from "@/lib/cities";

// Reemplazar líneas 64-78 con:
<div className="space-y-2">
  <Label htmlFor="cityArea" className="text-sm font-medium">
    Ciudad/Municipio *
  </Label>
  <Select
    value={formData.cityArea}
    onValueChange={(value) => handleInputChange('cityArea', value)}
  >
    <SelectTrigger className="pl-10">
      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <SelectValue placeholder="Selecciona tu municipio" />
    </SelectTrigger>
    <SelectContent className="bg-white z-50">
      {GUATEMALA_MUNICIPALITIES.map((muni) => (
        <SelectItem key={muni.value} value={muni.value}>
          {muni.label}
          {muni.isCapital && <span className="text-xs text-green-600 ml-2">(Q25)</span>}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Ciudad de Guatemala: Q25 | Otros municipios: Q60
  </p>
</div>
```

### 3. `src/lib/pricing.ts`
Actualizar `isGuatemalaCityArea` para manejar el valor exacto del dropdown:

```typescript
// Agregar coincidencia exacta para "Ciudad de Guatemala"
const guatemalaCityPatterns = [
  /^guatemala$/,
  /^guatemala\s*city$/i,
  /^ciudad\s*de\s*guatemala$/i,  // Coincidencia exacta del dropdown
  /^ciudad\s+de\s+guatemala/i,   // Con espacios
  // ... resto de patrones
];
```

## Beneficios

1. **UX mejorada**: Los usuarios seleccionan de una lista clara
2. **Datos consistentes**: Evita variaciones como "Ciudad guatemala", "Guate", etc.
3. **Transparencia de precios**: Muestra indicador de Q25/Q60 en cada opción
4. **Corrección del bug**: El valor guardado será exactamente "Ciudad de Guatemala"

## Compatibilidad hacia atrás

Los datos existentes seguirán funcionando porque `isGuatemalaCityArea` ya maneja múltiples variaciones. Los nuevos registros usarán valores estandarizados.
