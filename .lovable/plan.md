
Objetivo: atacar la causa real del doble tap en los formularios de shopper y traveler sin seguir cambiando wrappers dentro de cada formulario.

Diagnóstico
- `PackageRequestForm.tsx` y `TripForm.tsx` ya no usan `Sheet`; ambos usan el `Dialog` compartido.
- La causa más probable sigue en `src/components/ui/dialog.tsx`, donde `DialogPrimitive.Content` tiene este handler global:
  ```tsx
  onOpenAutoFocus={(e) => {
    if (window.innerWidth < 768) e.preventDefault();
    props.onOpenAutoFocus?.(e);
  }}
  ```
- Ese `preventDefault()` corre en mobile para todos los dialogs y puede desordenar el flujo de foco/touch de iOS Safari, que encaja con el síntoma de “primer tap no entra”.

Plan de implementación
1. Editar `src/components/ui/dialog.tsx`
   - Eliminar el `onOpenAutoFocus` custom del `DialogPrimitive.Content`.
   - No tocar `onPointerDownOutside` ni el resto de estilos/comportamiento.

2. Dejar `PackageRequestForm.tsx` y `TripForm.tsx` sin cambios estructurales
   - Ya están montando el `Dialog` compartido.
   - No hace falta volver a cambiar wrappers si el problema está en la capa base.

3. Validar impacto
   - Probar ambos flujos:
     - abrir “Nueva Solicitud de Paquete”
     - abrir “Registrar Nuevo Viaje”
   - Verificar en mobile que el primer tap funcione en:
     - inputs de texto
     - selects/combobox
     - checkbox/radio
     - calendario/popover
     - botones de siguiente/atrás/cerrar
   - Confirmar que el teclado no se abra de forma indeseada al abrir el modal.

Archivos
- `src/components/ui/dialog.tsx` — cambio real
- `src/components/PackageRequestForm.tsx` — solo revisión
- `src/components/TripForm.tsx` — solo revisión

Nota técnica
- Los intentos anteriores atacaron `Sheet`, overlays y CSS local, pero hoy esos formularios dependen del `Dialog` compartido. Mientras ese handler global siga haciendo `e.preventDefault()` en mobile, el problema puede persistir aunque el formulario interno cambie.
- Si después de quitarlo todavía queda algún doble tap residual, el siguiente sospechoso sería CSS global de interacción táctil, no el wrapper de los forms.
