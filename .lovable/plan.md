

## Customer Experience - Nueva Página Admin

### Resumen
Crear una nueva página `/admin/customer-experience` accesible desde Admin Control, con dos tablas (Shoppers y Viajeros) que listen todos los pedidos completados. Cada fila permitira registrar datos de una llamada de seguimiento: rating, notas, estado de la llamada y fecha.

### Base de datos
Crear tabla `customer_experience_calls` para persistir las llamadas:

```sql
CREATE TABLE customer_experience_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'shopper' o 'traveler'
  target_user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  call_status TEXT NOT NULL DEFAULT 'pending', -- pending, contacted, no_answer, completed
  call_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID
);

ALTER TABLE customer_experience_calls ENABLE ROW LEVEL SECURITY;

-- Solo admins
CREATE POLICY "Admins can manage cx calls"
  ON customer_experience_calls FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
```

### Archivos a crear/modificar

1. **`src/pages/AdminCustomerExperience.tsx`** - Pagina principal con dos tabs: "Shoppers" y "Viajeros". Cada tab muestra una tabla de paquetes completados con columnas:
   - Fecha completado
   - Nombre del usuario (shopper o viajero segun tab)
   - Producto
   - Estado de llamada (badge con selector)
   - Rating (selector de estrellas 1-5)
   - Notas (input inline o modal)
   - Fecha de llamada (datepicker)
   - Boton guardar

2. **`src/components/admin/cx/CustomerExperienceTable.tsx`** - Componente tabla reutilizable para ambas tabs (shoppers/viajeros). Carga paquetes completados y hace join con `customer_experience_calls` para mostrar datos existentes. Permite editar inline.

3. **`src/App.tsx`** - Agregar ruta `/admin/customer-experience`

4. **`src/pages/AdminControl.tsx`** - Agregar card de navegacion "Customer Experience" con icono `HeadphonesIcon` o similar

### Logica de datos
- Query paquetes con `status = 'completed'` directamente desde Supabase (no depende del admin dashboard hook)
- Para tab Shoppers: lista unica por `package_id + user_id` (shopper)
- Para tab Viajeros: lista unica por `package_id + traveler_id` (via `matched_trip_id -> trips.user_id`). Un viajero puede aparecer multiples veces si llevo multiples paquetes
- Left join con `customer_experience_calls` para mostrar estado existente
- Filtros por estado de llamada (pendiente/contactado/completado/no contestó)

### UX
- Badges de colores para estado: gris=pendiente, amarillo=contactado, rojo=no contestó, verde=completado
- Rating con estrellas clickeables
- Notas editables con textarea en modal/popover
- Estadisticas arriba: total pendientes, total completados, promedio rating

