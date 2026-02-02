
# Plan: Integrar "Devolución" como opción dentro de Pedido Personal

## Resumen de Cambios

Según tus sugerencias, implementaremos:
1. Pregunta "¿Tu pedido es una devolución?" (Sí/No) después de seleccionar Pedido Personal
2. Opciones de entrega adaptadas para devoluciones en el paso de Ruta
3. Eliminar la nota de costos de envío para devoluciones

## Cambios en la UI

### Step 1: Tipo de Solicitud

Después de seleccionar "Pedido Personal", mostrar:

```
┌─────────────────────────────────────────────────────┐
│  ¿Tu pedido es una devolución?                      │
│                                                     │
│  ○ No - Es un pedido normal                        │
│  ○ Sí - Necesito devolver un producto              │
│                                                     │
│  (Descripción breve cuando selecciona Sí)          │
│  "El viajero entregará tu paquete en un punto      │
│   de devolución en el país de destino"             │
└─────────────────────────────────────────────────────┘
```

### Step 3: Ruta - Opciones de Entrega para Devoluciones

Cuando `isReturn === true`, cambiar las opciones de entrega:

```
┌─────────────────────────────────────────────────────┐
│  ¿Cómo debe entregar el viajero tu paquete         │
│  en Estados Unidos? *                               │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📍 Entregarlo en un punto de devolución     │   │
│  │    El viajero lo dejará en UPS/FedEx/etc.   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🚚 Una empresa recogerá el paquete en tu    │   │
│  │    domicilio en Estados Unidos              │   │
│  │    Ya tienes programado un pickup           │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Eliminación de Nota de Costos

La nota actual:
> "El costo de envío a domicilio fuera de Ciudad de Guatemala es de Q60 (Q35 para usuarios Prime)"

**Se oculta** cuando `isReturn === true` porque no aplica para devoluciones.

---

## Detalles Técnicos

### Archivo: `src/components/PackageRequestForm.tsx`

**1. Agregar estado `isReturn` al formulario**

En `getInitialFormState()` (línea ~101):
```typescript
isReturn: false
```

**2. Crear helper para acceder al estado**

```typescript
const isReturn = formState.isReturn || false;
const setIsReturn = (value: boolean) => updateField('isReturn', value);
```

**3. Agregar pregunta de devolución en Step 1** (después de línea 770)

```typescript
{formRequestType === 'personal' && (
  <div className="mt-4 p-4 border rounded-lg bg-muted/50">
    <Label className="text-base font-medium">¿Tu pedido es una devolución?</Label>
    <RadioGroup
      value={isReturn ? 'yes' : 'no'}
      onValueChange={(value) => setIsReturn(value === 'yes')}
      className="mt-3 space-y-2"
    >
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="no" id="return-no" />
        <Label htmlFor="return-no" className="cursor-pointer">
          No - Es un pedido normal
        </Label>
      </div>
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="yes" id="return-yes" />
        <Label htmlFor="return-yes" className="cursor-pointer">
          Sí - Necesito devolver un producto
        </Label>
      </div>
    </RadioGroup>
    {isReturn && (
      <p className="text-xs text-muted-foreground mt-2 pl-6">
        El viajero entregará tu paquete en un punto de devolución en el país de destino
      </p>
    )}
  </div>
)}
```

**4. Adaptar opciones de entrega en Step 3** (líneas 1132-1229)

Agregar condicional para devoluciones:

```typescript
{isReturn ? (
  // Opciones de entrega para DEVOLUCIONES
  <div className="space-y-4 pt-2 border-t border-border">
    <Label className="text-base font-medium">
      ¿Cómo debe entregar el viajero tu paquete en {selectedCountry}? *
    </Label>
    <div className="space-y-3">
      {/* Opción 1: Punto de devolución */}
      <div 
        onClick={() => handleInputChange('deliveryMethod', 'return_dropoff')}
        className={cn(
          "border-2 rounded-lg p-4 cursor-pointer transition-all",
          formData.deliveryMethod === 'return_dropoff' 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-muted-foreground'
        )}
      >
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Entregarlo en un punto de devolución</p>
            <p className="text-sm text-muted-foreground">
              El viajero lo dejará en UPS Store, FedEx Office, etc.
            </p>
          </div>
        </div>
      </div>
      
      {/* Opción 2: Pickup programado */}
      <div 
        onClick={() => handleInputChange('deliveryMethod', 'return_pickup')}
        className={cn(
          "border-2 rounded-lg p-4 cursor-pointer transition-all",
          formData.deliveryMethod === 'return_pickup' 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-muted-foreground'
        )}
      >
        <div className="flex items-start gap-3">
          <Truck className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Una empresa recogerá el paquete en tu domicilio en {selectedCountry}</p>
            <p className="text-sm text-muted-foreground">
              Ya tienes programado un pickup en la dirección del viajero
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
) : isGuatemalaDestination ? (
  // Opciones normales existentes para Guatemala...
)}
```

**5. Ocultar nota de costos para devoluciones** (líneas 1216-1228)

Envolver las notas existentes en:

```typescript
{!isReturn && (
  isGuatemalaCityDestination ? (
    <div className="bg-primary/10 border border-primary/20 rounded p-3">
      <p className="text-sm text-primary">
        📌 <strong>Nota:</strong> El envío a domicilio dentro de Ciudad de Guatemala...
      </p>
    </div>
  ) : (
    <div className="bg-primary/10 border border-primary/20 rounded p-3">
      <p className="text-sm text-primary">
        📌 <strong>Nota:</strong> El costo de envío a domicilio fuera de Ciudad de Guatemala...
      </p>
    </div>
  )
)}
```

**6. Resetear `isReturn` cuando cambia el tipo de solicitud**

En `handleTypeSelect` (línea ~687):
```typescript
const handleTypeSelect = (type: 'online' | 'personal') => {
  updateField('formRequestType', type);
  // Reset isReturn when switching away from personal
  if (type === 'online') {
    updateField('isReturn', false);
  }
  // ... resto del código existente
};
```

---

## Flujo Completo del Usuario

```
Paso 1: Selecciona "Pedido Personal"
         ↓
      "¿Tu pedido es una devolución?"
         ↓
      [Sí] / [No]
         ↓
Paso 2: Detalles del producto (igual que ahora)
         ↓
Paso 3: Ruta
      - Destino: [Estados Unidos ▼] [Miami ▼]
      - Forma de entrega:
        [Sí es devolución]:
          ○ Entregarlo en un punto de devolución
          ○ Una empresa recogerá el paquete...
        [No es devolución]:
          ○ Pickup en Oficina
          ○ Enviarlo a mi domicilio
          + Nota de costos (solo si NO es devolución)
         ↓
Paso 4: Confirmar
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/PackageRequestForm.tsx` | Agregar `isReturn` al estado, pregunta Sí/No, opciones de entrega adaptadas, ocultar nota de costos |

## Beneficios

- Integración simple dentro del flujo existente
- UX clara con pregunta explícita Sí/No
- Opciones de entrega específicas para devoluciones
- Sin cambios en el modelo de datos (solo usa campos existentes)
