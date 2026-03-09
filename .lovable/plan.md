

## Reorganizar TripDetailModal: layout compacto + paquetes desplegables

### Cambios en `src/components/dashboard/TripDetailModal.tsx`

**1. Compactar la información del viaje**
- Combinar "Ruta del Viaje" como inline header (no sección separada): mostrar `from_city → to_city` directamente debajo del título del modal
- Fusionar "Fechas Importantes" y "Ventana para Recibir Paquetes" en una sola sección con grid más compacto (4 columnas en desktop): Llegada, Entrega, Primer día, Último día + método de entrega inline
- Reducir spacing general de `space-y-4 sm:space-y-6` a `space-y-3 sm:space-y-4`
- Reducir padding de las secciones bg-muted

**2. Paquetes Asignados como Collapsible/Accordion**
- Importar `Collapsible, CollapsibleTrigger, CollapsibleContent` de `@/components/ui/collapsible`
- Importar `ChevronDown` de lucide-react
- Cada paquete se convierte en un `Collapsible`: el trigger muestra nombre, status badge y precio en una línea compacta; el contenido expandible muestra los detalles (productos, links, origen/destino)
- Los paquetes empiezan colapsados por defecto

**3. Eliminar sección "Información Adicional"** (registrado el / última actualización) para reducir ruido — esa info ya no se muestra en el TripCard tampoco

**4. Capacidad disponible** se muestra inline junto al método de entrega en vez de sección separada

### Resultado
Modal más limpio y corto. Los paquetes se ven como lista resumida que el usuario puede expandir individualmente para ver detalles.

