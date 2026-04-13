

## Plan: Simplificar Step 1 del PackageRequestForm para movil

### Cambios en `src/components/PackageRequestForm.tsx`

**1. Limpiar texto del campo admin (lineas 715-727)**
- Linea 716: Cambiar `📋 Nombre del Shopper (pedido a nombre de)` → `📋 Nombre del Shopper`
- Eliminar lineas 725-727: el parrafo con "Este nombre aparecerá en la etiqueta..."

**2. Reducir altura de las cards de tipo de pedido (lineas 740-805)**
- Cambiar `p-4` → `p-3` en ambos botones (lineas 744 y 778)
- Cambiar `w-12 h-12` → `w-10 h-10` en los circulos de icono (lineas 752 y 785)
- Cambiar `h-6 w-6` → `h-5 w-5` en los iconos (lineas 757 y 792)  
- Cambiar `space-y-2` → `space-y-1` en los contenedores flex (lineas 750 y 784)
- Cambiar layout de vertical a horizontal en movil: usar `flex-row items-center` en vez de `flex-col items-center text-center` y alinear texto a la izquierda

Esto reduce scroll significativamente en el Step 1 movil.

