

## Agregar buscador de nombres en Customer Experience

### Qué cambia
Agregar un campo de búsqueda junto al filtro de estado existente para filtrar las filas por nombre de usuario.

### Implementación

**1. `src/pages/AdminCustomerExperience.tsx`**
- Agregar estado `searchTerm` en `CXTab`
- Renderizar un `Input` con icono `Search` al lado del `Select` de filtro (línea 55-69)
- Filtrar `rows` localmente por nombre antes de pasarlas a `CustomerExperienceTable`:
```ts
const filteredRows = rows.filter(r =>
  !searchTerm || r.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
);
```
- Pasar `filteredRows` en vez de `rows` al componente tabla
- Actualizar stats para que reflejen el total sin filtrar (mantener `stats` del hook)

### Archivos
- **Modificar**: `src/pages/AdminCustomerExperience.tsx`

