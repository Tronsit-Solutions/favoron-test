

## Reestructurar pestaña "Mis Viajes": paquetes anidados bajo cada viaje

Actualmente la pestaña tiene dos secciones separadas: "Mis Viajes Registrados" (TripCards) y "Mis Paquetes Asignados" (lista plana de CollapsibleTravelerPackageCard). La idea es unificarlas: cada TripCard es el elemento padre y sus paquetes asignados aparecen debajo como hijos colapsables.

Ya existe un componente `TripPackagesGroup` que hace exactamente esto (agrupa paquetes por viaje con collapsible), pero no se usa en el Dashboard principal.

### Cambios

**`src/components/Dashboard.tsx`** (líneas ~731-942):

1. Eliminar la sección separada "Mis Paquetes Asignados" (líneas ~796-941) con su resumen de tips y la lista plana de paquetes.

2. Modificar el renderizado de cada viaje para que debajo de cada `TripCard` se muestren sus paquetes asignados usando `CollapsibleTravelerPackageCard`, aplicando la misma lógica de filtrado y ordenamiento que existe actualmente.

La estructura resultante por cada viaje sería:

```text
┌─────────────────────────────────┐
│  TripCard (Madrid → Guatemala)  │  ← card del viaje con info, status, acciones
│  📦 Resumen: Q220 tips · 2 pkg │  ← mini resumen de paquetes (ya existe en TripCard via TripPaymentSummary)
├─────────────────────────────────┤
│  ▸ Saco mujer          Pagado  │  ← CollapsibleTravelerPackageCard
│  ▸ Zapatos             En ruta │  ← CollapsibleTravelerPackageCard
└─────────────────────────────────┘
```

3. Mover la lógica de filtrado de paquetes (exclusión de completed_paid, timers, etc.) a cada grupo de viaje, filtrando `assignedPackages.filter(pkg => pkg.matched_trip_id === trip.id)` y aplicando los mismos criterios de visibilidad y ordenamiento.

4. Si un viaje no tiene paquetes asignados visibles, solo se muestra el TripCard sin sección de paquetes debajo.

### Archivos
- **Modificar**: `src/components/Dashboard.tsx` — reestructurar la sección trips para anidar paquetes bajo cada viaje

