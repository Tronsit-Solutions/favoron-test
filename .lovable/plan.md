

## Mejora UI: Empaque original en formulario mobile

### Problema actual
La seccion de "empaque original" en mobile se ve apretada: el texto largo y los radio buttons estan en una sola linea horizontal (`flex items-center justify-between`), lo que hace dificil leer y tocar en pantallas pequenas.

### Cambios propuestos

**Archivo: `src/components/PackageRequestForm.tsx`** (2 secciones identicas: lineas 1006-1032 y 1124-1150)

Reemplazar el layout horizontal por un layout vertical mas claro en mobile:

1. **Mejor texto explicativo**: Cambiar el label a algo mas claro como "Empaque original del producto" y mejorar la descripcion para que sea mas intuitiva: "Necesito la caja/empaque de la marca (ej: caja del iPhone, bolsa de Nike). No es la caja de envio."

2. **Layout vertical en mobile**: En lugar de `flex justify-between` horizontal, usar un layout que apile el texto arriba y los radio buttons abajo, con touch targets mas grandes (min-height 44px).

3. **Radio buttons mas grandes y claros**: Hacer los labels de "Si" y "No" mas grandes con padding para mejor tap target en mobile.

4. **Icono visual**: Agregar el icono de Package (de lucide-react) para dar contexto visual rapido.

### Estructura nueva (ambas secciones):

```text
+------------------------------------------+
| [icono] Empaque original del producto     |
| Necesito la caja/empaque de la marca      |
| (ej: caja del iPhone, bolsa de Nike).     |
| No es la caja de envio.                   |
|                                           |
|   ( ) Si, necesito empaque original       |
|   (o) No, no lo necesito                  |
+------------------------------------------+
```

### Detalles tecnicos

- Modificar las 2 secciones identicas en `PackageRequestForm.tsx` (online y personal order)
- Cambiar `flex items-center justify-between` por `space-y-2` para layout vertical
- Agregar `Package` icon de lucide-react (ya importado en el archivo)
- Radio items con labels descriptivos y min-height 44px para touch targets
- Texto del label: font-weight medium, tamano text-sm en lugar de text-xs
- Descripcion: text-xs con color muted

