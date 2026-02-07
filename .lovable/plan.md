

## Mostrar informacion de envio completa en el modal del viajero

### Problema
El modal de perfil del viajero (que aparece al hacer click en el nombre de un viajero en "Hacer Match") no muestra toda la informacion de envio almacenada en la base de datos:

**Campos que faltan mostrar:**
- `accommodationType` - Tipo de hospedaje (casa, hotel, airbnb)
- `postalCode` - Codigo postal
- `recipientName` - Nombre del destinatario

**Campos existentes pero pueden mejorar:**
- `hotelAirbnbName` - Ya se muestra pero se podria contextualizar mejor segun el tipo de alojamiento

### Solucion
Agregar los campos faltantes a la seccion "Informacion de Envio" del modal en `AdminMatchDialog.tsx`.

### Cambios tecnicos

**Archivo:** `src/components/admin/AdminMatchDialog.tsx`

**Seccion:** Lineas 1584-1637 (Informacion de Envio)

Agregar los siguientes campos despues de la direccion principal:

```tsx
{/* Tipo de Hospedaje - NUEVO */}
{selectedTraveler.trip.package_receiving_address.accommodationType && (
  <div>
    <p className="text-sm font-medium">Tipo de Hospedaje</p>
    <p className="text-sm text-muted-foreground capitalize">
      {selectedTraveler.trip.package_receiving_address.accommodationType === 'casa' 
        ? 'Casa' 
        : selectedTraveler.trip.package_receiving_address.accommodationType === 'hotel'
        ? 'Hotel'
        : selectedTraveler.trip.package_receiving_address.accommodationType === 'airbnb'
        ? 'Airbnb'
        : selectedTraveler.trip.package_receiving_address.accommodationType}
    </p>
  </div>
)}

{/* Nombre del lugar - contextualizado por tipo */}
{selectedTraveler.trip.package_receiving_address.hotelAirbnbName && (
  <div>
    <p className="text-sm font-medium">
      {selectedTraveler.trip.package_receiving_address.accommodationType === 'hotel' 
        ? 'Nombre del Hotel'
        : selectedTraveler.trip.package_receiving_address.accommodationType === 'airbnb'
        ? 'Nombre del Airbnb'
        : 'Nombre del Edificio/Residencial'}
    </p>
    <p className="text-sm text-muted-foreground">
      {selectedTraveler.trip.package_receiving_address.hotelAirbnbName}
    </p>
  </div>
)}

{/* Codigo Postal - NUEVO */}
{selectedTraveler.trip.package_receiving_address.postalCode && (
  <div>
    <p className="text-sm font-medium">Codigo Postal</p>
    <p className="text-sm text-muted-foreground">
      {selectedTraveler.trip.package_receiving_address.postalCode}
    </p>
  </div>
)}

{/* Nombre del Destinatario - NUEVO */}
{selectedTraveler.trip.package_receiving_address.recipientName && (
  <div>
    <p className="text-sm font-medium">Destinatario</p>
    <p className="text-sm text-muted-foreground">
      {selectedTraveler.trip.package_receiving_address.recipientName}
    </p>
  </div>
)}
```

### Orden final de campos en "Informacion de Envio"

1. **Direccion de Recepcion** (streetAddress)
2. **Direccion 2** (streetAddress2) - si existe
3. **Ciudad/Area** (cityArea)
4. **Codigo Postal** (postalCode) - NUEVO
5. **Tipo de Hospedaje** (accommodationType) - NUEVO
6. **Nombre del Hotel/Airbnb/Edificio** (hotelAirbnbName) - con etiqueta contextual
7. **Destinatario** (recipientName) - NUEVO
8. **Telefono de Contacto** (contactNumber)
9. **Ventana de Recepcion de Paquetes** (first_day_packages - last_day_packages)

### Datos disponibles en la base de datos

Ejemplo de un registro real de `package_receiving_address`:
```json
{
  "accommodationType": "casa",
  "cityArea": "Miami Florida",
  "contactNumber": "+50230007161",
  "hotelAirbnbName": "Key biscayne",
  "postalCode": "33149",
  "recipientName": "Nicole Berger",
  "streetAddress": "155 ocean drive key biscayne",
  "streetAddress2": "Apt 1210"
}
```

