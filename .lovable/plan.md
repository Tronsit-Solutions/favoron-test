

## Compactar el modal de Completar Pago

### Cambios en `src/components/quote/QuotePaymentStep.tsx`

**1. Datos Bancarios — hacerlo más compacto**
- Cambiar de grid 2x2 con cards individuales a una vista inline compacta: una sola fila o dos filas con los 4 datos (Banco, Titular, Cuenta, Tipo) en texto pequeño con botones de copiar inline, sin los bloques `bg-muted/30 rounded-lg p-3` individuales.
- Reducir el padding del CardHeader y CardContent.

**2. Eliminar la card "Instrucciones de Pago" por completo**
- Fusionar el mensaje clave con la sección de "Subir Comprobante de Pago".
- En lugar de 4 pasos separados, agregar un subtítulo corto dentro de la card de comprobante: algo como _"Transfiere Q{amount} a la cuenta de arriba y sube tu comprobante aquí"_.

**3. Unificar en la card de Subir Comprobante**
- El `CardTitle` cambia a "Subir Comprobante de Pago"
- Debajo del título, un `<p>` con la instrucción sintetizada
- Luego el componente `PaymentReceiptUpload` como está

### Resultado
Se eliminan ~2 cards completas del flujo de transferencia bancaria, reduciendo significativamente la altura del modal.

