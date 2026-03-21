

## Agregar timer en vivo a cada asignación de viajero

### Problema
Actualmente la sección "Viajeros Asignados" en `PackageDetailModal.tsx` muestra la fecha/hora de expiración como texto estático ("Expira: 22/3/2026 14:30") y solo para `bid_pending`. El usuario quiere un countdown en vivo.

### Solución

**Modificar `src/components/admin/PackageDetailModal.tsx`**:

1. Importar el hook `useCountdown` que ya existe en el proyecto
2. Crear un mini-componente `AssignmentCountdown` dentro del archivo que use `useCountdown` con el `expires_at` de cada assignment
3. Reemplazar el texto estático de expiración (líneas 1379-1384) por el countdown en vivo mostrando `HH:MM:SS` restante
4. Mostrar el timer para assignments en estados `bid_pending` y `bid_submitted` (los que aún están activos)
5. Colorear: amarillo/amber si queda tiempo, rojo si quedan menos de 2 horas, gris si ya expiró

### Detalle
- Se reutiliza `useCountdown` de `src/hooks/useCountdown.tsx` — no se crea lógica nueva de timer
- El mini-componente es necesario porque hooks no se pueden llamar dentro de un `.map()` directamente
- Formato: `⏱ 23h 45m 12s` o `⏱ Expirado` si ya pasó

### Archivos
- **Modificar**: `src/components/admin/PackageDetailModal.tsx` (~20 líneas)

