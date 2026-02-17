

## Fix: Destino de paquetes personales guarda pais incorrecto

### Problema encontrado

El paquete "bote blanco (pastillero) NaturDreams" tiene estos datos en la base de datos:
- `purchase_origin`: "guatemala" (correcto - el paquete esta en Guatemala)
- `package_destination`: "Madrid" (correcto - la ciudad destino)
- `package_destination_country`: "guatemala" (INCORRECTO - deberia ser "Espana")

Esto causa que el matching muestre viajes hacia Guatemala en vez de viajes hacia Espana/Madrid.

### Causa raiz

Hay **dos problemas** trabajando juntos:

**1. Fallback silencioso a "guatemala"** en dos lugares:
- `src/hooks/useDashboardActions.tsx` linea 75: `package_destination_country: packageData.packageDestinationCountry || 'guatemala'`
- `src/components/admin/PackageDetailModal.tsx` linea 703: `package_destination_country: selectedDestinationCountry || 'guatemala'`
- La columna en la base de datos tiene default `'guatemala'::text`

Si por cualquier razon el campo `selectedCountry` llega vacio (por el autosave del formulario, por un click rapido, etc.), el sistema guarda "guatemala" silenciosamente.

**2. No hay validacion cruzada** entre la ciudad de destino y el pais de destino. El usuario podria seleccionar "Guatemala" como pais y escribir "Madrid" en "Otra ciudad", o el autosave podria restaurar un estado inconsistente.

### Solucion propuesta

**A. Eliminar el fallback silencioso a "guatemala"**

En `useDashboardActions.tsx` y `PackageDetailModal.tsx`, cambiar el fallback `|| 'guatemala'` por una validacion que lance un error si el pais no esta seleccionado:

```typescript
// Antes
package_destination_country: packageData.packageDestinationCountry || 'guatemala'

// Despues  
package_destination_country: packageData.packageDestinationCountry
```

La validacion del formulario (Step 3) ya exige `selectedCountry`, asi que nunca deberia llegar vacio. Si llega vacio, es mejor que falle con un error visible que guardar datos incorrectos silenciosamente.

**B. Agregar validacion cruzada en el submit**

En `PackageRequestForm.tsx`, antes de enviar, verificar que la ciudad seleccionada corresponda al pais seleccionado:

- Si `selectedCountry` es "Guatemala" pero la ciudad no esta en la lista de ciudades de Guatemala, mostrar un error
- Si la ciudad es "Madrid" y el pais es "Guatemala", bloquear el envio

**C. Inferir el pais desde la ciudad como ultimo recurso**

Si por alguna razon el pais llega vacio al backend, intentar inferirlo de la ciudad usando un mapa simple (Madrid->Espana, Miami->USA, etc.) en vez de defaultear a Guatemala.

**D. Corregir el paquete existente**

Ejecutar un UPDATE directo para corregir este paquete especifico:
```sql
UPDATE packages 
SET package_destination_country = 'España'
WHERE id = 'bdadf0ac-76d5-4d4e-8a09-f045471bea99';
```

Y buscar otros paquetes con inconsistencias similares para corregirlos tambien.

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useDashboardActions.tsx` | Remover fallback `\|\| 'guatemala'`, agregar validacion |
| `src/components/admin/PackageDetailModal.tsx` | Remover fallback `\|\| 'guatemala'`, agregar validacion |
| `src/components/PackageRequestForm.tsx` | Agregar validacion cruzada pais-ciudad en Step 3 y submit |
| Migration SQL | Corregir paquetes existentes con pais incorrecto, cambiar DB default a NULL |

### Verificacion adicional

Buscar en la base de datos otros paquetes donde `package_destination` no corresponda al `package_destination_country` para detectar mas casos del mismo problema.

