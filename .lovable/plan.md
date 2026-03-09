

## Expandir foto de perfil del viajero en AdminMatchDialog

### Cambio

**`src/components/admin/AdminMatchDialog.tsx`**

1. Importar `ImageViewerModal` (ya existe en el proyecto)
2. Agregar estado `imageViewerOpen` y `imageViewerUrl`
3. Hacer el `Avatar` clickeable con `cursor-pointer` — al hacer click, abrir `ImageViewerModal` con la URL de alta resolución del avatar
4. Renderizar `ImageViewerModal` al final del componente

Cambio mínimo: ~10 líneas nuevas, solo en este archivo.

