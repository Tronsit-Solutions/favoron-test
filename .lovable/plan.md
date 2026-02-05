
## Mostrar "Zona Bernabéu" para Madrid

### Cambios necesarios

#### 1. Actualizar base de datos
Agregar "Zona Bernabéu" al campo `instructions` del delivery point de Madrid:

```sql
UPDATE delivery_points 
SET instructions = 'Zona Bernabéu'
WHERE id = 'aeb8aa05-3674-4ce8-9574-e4e2f975539c';
```

#### 2. Modificar TripForm.tsx (línea 1166)

Cambiar el texto hardcodeado por lógica dinámica:

**Antes:**
```tsx
<p className="text-sm text-muted-foreground">Zona 14, Ciudad de Guatemala</p>
```

**Después:**
```tsx
<p className="text-sm text-muted-foreground">
  {isDestinationGuatemala 
    ? 'Zona 14, Ciudad de Guatemala'
    : destinationDeliveryPoint?.instructions || destinationDeliveryPoint?.city || 'Punto de entrega'}
</p>
```

### Resultado

| Destino | Texto mostrado |
|---------|---------------|
| Guatemala | Zona 14, Ciudad de Guatemala |
| Madrid | Zona Bernabéu |
| Otro con delivery point | Usa `instructions` o nombre de ciudad |
