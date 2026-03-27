

## Problema

Actualmente la pestaña "Mis Viajes" muestra **todos los viajes activos a la vez**, cada uno con sus paquetes anidados. Para viajeros como Cecilia Prahl (4+ viajes, 18+ paquetes), esto genera un scroll largo y confuso.

## Solución: Selector de viaje único

Agregar un **dropdown selector de viaje** al inicio de la pestaña "Mis Viajes" que filtre para mostrar solo un viaje a la vez con sus paquetes.

```text
┌─────────────────────────────────────┐
│ Mis Viajes                          │
│ Gestiona tus viajes...              │
│                                     │
│ [▼ Texas → GUA - 10 Abr 2026    ]  │  ← Selector dropdown
│                                     │
│ ┌─ TripCard (viaje seleccionado) ─┐ │
│ │  Texas → Guatemala              │ │
│ │  10 Abr 2026 · En tránsito      │ │
│ └──────────────────────────────────┘ │
│   │ 📦 6 paquetes asignados        │
│   ├── Paquete 1                     │
│   ├── Paquete 2                     │
│   └── ...                           │
└─────────────────────────────────────┘
```

### Comportamiento
- **Default**: Se selecciona automáticamente el primer viaje (el más próximo o con acciones pendientes)
- Cada opción del dropdown muestra: ruta (ciudad→ciudad) + fecha de llegada
- Solo se renderiza **un viaje y sus paquetes** a la vez
- Ya existe el componente `TripSelector` en `src/components/dashboard/TripSelector.tsx` — se reutilizará adaptándolo (quitando la opción "Todos los viajes" ya que siempre se muestra uno solo)

### Archivo a modificar
- **`src/components/Dashboard.tsx`**: Agregar estado `selectedTripId`, insertar `TripSelector` antes del listado, filtrar `filteredUserTrips` para mostrar solo el viaje seleccionado
- **`src/components/dashboard/TripSelector.tsx`**: Adaptar para no incluir opción "Todos" y ajustar el diseño al contexto del viajero

