

## Agregar menu inicial al SupportBubble con dos opciones

### Concepto
Al abrir el panel de soporte, en lugar de mostrar directamente las FAQs, se presenta una pantalla inicial con dos botones/tarjetas:

1. **Reportar un error** - Abre un formulario de reporte de bug
2. **Servicio al cliente** - Muestra las FAQs + boton de WhatsApp (vista actual)

### Cambios en `src/components/SupportBubble.tsx`

**Nuevo estado de navegacion interna:**
- `view`: `'menu' | 'bug-report' | 'customer-service'` (inicia en `'menu'`)
- Al cerrar el panel, se resetea a `'menu'`

**Vista "menu" (nueva pantalla inicial):**
- Dos tarjetas/botones con iconos:
  - Bug (icono `AlertTriangle`) -> cambia a vista `'bug-report'`
  - Servicio al cliente (icono `MessageCircle`) -> cambia a vista `'customer-service'`

**Vista "bug-report" (nuevo formulario):**
- Boton de "volver" al menu
- Campos del formulario:
  - Descripcion del error (textarea, requerido)
  - Pagina/seccion donde ocurrio (texto, opcional)
  - Captura de pantalla (file upload opcional)
- Al enviar, usa `window.favoronLogError()` (del clientErrorLogger existente) para registrar el error con tipo `'user-report'` y contexto adicional (ruta actual, descripcion, etc.)
- Tambien invoca la edge function `log-client-error` con `type: 'user_report'` y `severity: 'warning'`
- Muestra confirmacion con toast de "Reporte enviado"

**Vista "customer-service":**
- Boton de "volver" al menu
- Contenido actual: FAQs + boton WhatsApp (sin cambios)

### Flujo de reporte de error

El formulario reutiliza la infraestructura existente de `clientErrorLogger.ts`:
- Llama a `sendLog()` con los datos del formulario
- Se registra en la tabla `client_errors` con `type = 'user_report'`
- Los admins pueden ver estos reportes en la pestana de Seguridad/Errores existente

### Archivos a modificar
- `src/components/SupportBubble.tsx` - Agregar estado de navegacion, vista menu, formulario de bug report, y reorganizar la vista de servicio al cliente

No se requieren nuevas dependencias ni cambios en base de datos, ya que se reutiliza la tabla `client_errors` existente.

