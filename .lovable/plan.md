
## Cambiar color del boton "Calificar viajero" a amarillo

### Cambio
En `src/components/dashboard/CollapsiblePackageCard.tsx`, reemplazar `variant="success"` por clases de Tailwind amarillas en los dos botones de "Calificar viajero" (mobile y desktop).

### Detalle tecnico
- **Lineas afectadas**: Los dos `<Button>` con texto "Calificar viajero" (mobile ~linea 601 y desktop ~linea 854)
- Cambiar de `variant="success"` a `variant="outline"` con clases adicionales: `bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500`
- Esto dara un boton amarillo que destaca visualmente como accion de feedback pendiente, diferenciandolo del verde de "Completado"
