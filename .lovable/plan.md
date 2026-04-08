

## Mover botón de info/onboarding al lado de "Mis Viajes"

### Cambio

**`src/components/Dashboard.tsx` (líneas 943-958)**

Mover el botón `HelpCircle` de dentro del grupo de botones (línea 955-957) a la derecha del título "Mis Viajes" (línea 945), en la misma fila.

De:
```tsx
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
  <div>
    <h3 className="text-xl sm:text-2xl font-bold">Mis Viajes</h3>
    ...
  </div>
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
    <Button variant="traveler" ...>Nuevo Viaje</Button>
    <Button variant="outline" size="icon" ...><HelpCircle /></Button>
  </div>
</div>
```

A:
```tsx
<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
  <div className="flex items-center gap-2">
    <h3 className="text-xl sm:text-2xl font-bold">Mis Viajes</h3>
    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowTravelerOnboarding(true)}>
      <HelpCircle className="h-4 w-4" />
    </Button>
  </div>
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
    <Button variant="traveler" ...>Nuevo Viaje</Button>
  </div>
</div>
```

El subtítulo desktop se mantiene debajo, fuera de la fila del título.

