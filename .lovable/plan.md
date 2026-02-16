

## Unificar Terminos y Condiciones (Pagina y Modal)

### Problema
Existen dos versiones de los terminos y condiciones con contenido diferente:
- **Modal** (`TermsAndConditionsModal.tsx`): Version mas completa con clausulas legales detalladas (IVA, intermediario de pagos, prohibicion de evasion, derecho de rechazo, cancelaciones, sanciones, etc.)
- **Pagina** (`TermsAndConditions.tsx`): Version simplificada que omite varias clausulas importantes

### Solucion

Usar el contenido del **modal** como fuente de verdad (es el mas completo legalmente) y actualizar la **pagina** para que contenga exactamente las mismas clausulas.

### Cambios

**Archivo**: `src/pages/TermsAndConditions.tsx`

1. **Seccion "Terminos Generales de Uso"** -> Renombrar a **"1. Uso General de la Plataforma"** y agregar las clausulas faltantes:
   - Papel de intermediario de pagos
   - IVA
   - Prohibicion de evasion del sistema
   - Derecho de rechazo
   - Mantener las existentes (informacion veridica, solo envios personales, cumplimiento legal)
   - Eliminar subsecciones que no estan en el modal (Que es Favoron, Quien puede usar, Datos personales, Buen trato, Cambios, Riesgos)

2. **Seccion "Terminos para Shoppers"** -> Renombrar a **"2. Para Shoppers (quienes piden productos)"** y sincronizar contenido con el modal:
   - Solo compras online (con detalle de tiendas reconocidas)
   - Confirmacion y seguimiento
   - Tiempos de entrega
   - Entrega segura
   - Costes adicionales
   - Retrasos en la entrega (con detalle de fecha limite)
   - Cobertura por perdida o robo (con sub-items)
   - Garantia limitada
   - Cancelaciones y reembolsos (con sub-items del 50% y ajuste de cotizacion)

3. **Seccion "Terminos para Viajeros"** -> Renombrar a **"3. Para Viajeros (quienes traen paquetes)"** y sincronizar:
   - Cumplimiento legal
   - Requisitos para traer paquetes
   - Recepcion del paquete (con detalle de hotel/Airbnb)
   - Responsabilidad
   - Deduccion por danos (nueva)
   - Prohibiciones
   - Sanciones internas por incumplimiento grave (nueva, incluye lista interna)

4. **Seccion "Limitaciones de Responsabilidad"** -> Mantener titulo, sincronizar items con el modal:
   - Papel de intermediario
   - Problemas ajenos
   - Retrasos y perjuicios
   - Responsabilidad limitada al valor declarado

5. **Seccion "Notificaciones por WhatsApp"** -> Sin cambios significativos, ya coincide

**Archivo**: `src/components/TermsAndConditionsModal.tsx`

No requiere cambios, ya tiene el contenido completo.

### Resultado esperado

Ambas versiones (pagina publica y modal) mostraran exactamente las mismas clausulas legales, con la misma estructura de 5 secciones numeradas y el mismo nivel de detalle. La unica diferencia sera el estilo visual (pagina completa vs modal con scroll).

