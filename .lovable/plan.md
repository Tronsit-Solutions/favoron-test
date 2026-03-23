

## Mejorar diseño del TripCard en admin matching

### Cambios visuales propuestos para `src/components/admin/matching/TripCard.tsx`

**1. Estructura con header visual claro**
- Separar la ruta (from_city -> to_city) como un header destacado con fondo sutil azul/gradient
- Mover el botón "Ver" como icono en la esquina superior derecha

**2. Sección de viajero mejorada**
- Avatar placeholder con iniciales + nombre + rating en una fila más limpia
- Badge de Boost junto al nombre

**3. Fechas en layout de grid compacto**
- Usar un grid de 2 columnas para las 4 fechas en vez de lista vertical
- Iconos consistentes con colores semánticos
- Labels más cortos y legibles

**4. Total de paquetes destacado**
- Mover el badge de total al footer de la card como un accent bar

**5. Limpiar console.logs**

### Layout propuesto
```text
┌──────────────────────────────────────┐
│ ✈  Miami → Guatemala City    🚀  👁 │  <- header con fondo sutil
│──────────────────────────────────────│
│ 👤 Anika Erichsen        ⭐ 4.8     │  <- traveler row
│──────────────────────────────────────│
│ 🛬 Viaje: 15 Mar    📦 Entrega: 20  │  <- dates grid
│ 📥 Desde: 10 Mar    📤 Hasta: 14    │
│──────────────────────────────────────│
│ 💰 Total asignado: $125.50          │  <- footer accent
└──────────────────────────────────────┘
```

### Archivos
- **Modificar**: `src/components/admin/matching/TripCard.tsx`

