

## Plan: Normalizar links de productos en AdminMatchDialog

### Problema
Los links de productos en el modal de matching no pasan por `normalizeProductUrl`, lo que causa que URLs sin protocolo (ej. `amazon.com/...`) se interpreten como rutas relativas del dominio de la app.

### Cambios

**`src/components/admin/AdminMatchDialog.tsx`**

1. Importar `normalizeProductUrl` desde `@/lib/validators`.
2. Aplicar `normalizeProductUrl()` en los 3 lugares donde se renderizan links de productos:
   - Línea ~662: badge "Ver producto" del resumen del paquete
   - Línea ~760: links individuales de cada producto en la vista expandida
   - Línea ~789: link fallback cuando no hay productos individuales

