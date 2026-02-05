

## Corregir Iframe de Pago Recurrente

### Problema Identificado
El iframe en línea 199-206 tiene permisos insuficientes:
```tsx
<iframe
  src={checkoutUrl}
  allow="payment"  // Solo esto - insuficiente
/>
```

Los formularios de pago de terceros necesitan:
- Ejecutar JavaScript
- Enviar formularios
- Acceder a cookies/storage
- Abrir popups para 3DS (autenticación de tarjeta)

### Solución Propuesta

Dado que los iframes para pagos son problemáticos por diseño (restricciones de seguridad del navegador), propongo **dos cambios**:

---

### Cambio 1: Agregar permisos completos al iframe

**Archivo: src/components/payment/RecurrenteCheckout.tsx (líneas 199-206)**

```tsx
<iframe
  ref={iframeRef}
  src={checkoutUrl}
  className="w-full h-full border-0"
  style={{ minHeight: '450px' }}
  allow="payment; camera; microphone"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
  referrerPolicy="no-referrer-when-downgrade"
  title="Recurrente Checkout"
/>
```

---

### Cambio 2: Priorizar "Abrir en nueva pestaña" como opción principal

Mover el botón de "Abrir en nueva pestaña" ANTES del iframe y hacerlo más prominente, ya que es la opción más confiable:

```tsx
{/* PRIMERO: Opción recomendada */}
<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
  <p className="text-sm text-blue-800 mb-2">
    <strong>Recomendado:</strong> Abre el formulario en una nueva pestaña para mejor compatibilidad
  </p>
  <Button variant="default" size="sm" onClick={handleOpenInNewTab} className="gap-2">
    <ExternalLink className="h-4 w-4" />
    Abrir formulario de pago
  </Button>
</div>

{/* SEGUNDO: Iframe como alternativa */}
<details className="border rounded-lg">
  <summary className="p-3 cursor-pointer text-sm text-muted-foreground">
    O completa el pago aquí (puede no funcionar en todos los navegadores)
  </summary>
  <div className="p-2">
    <iframe ... />
  </div>
</details>
```

---

### Por qué esta solución

1. **Iframe con permisos**: El `sandbox` con los permisos correctos permite que Recurrente funcione en navegadores compatibles
2. **Nueva pestaña como principal**: Es la opción más confiable para pagos de terceros
3. **Sin pérdida de funcionalidad**: El webhook sigue funcionando igual - cuando el usuario paga en nueva pestaña, el paquete se actualiza automáticamente

---

### Resultado esperado

- **Usuarios que abren nueva pestaña**: Pago funciona siempre (como confirmaste)
- **Usuarios que usan iframe**: Mayor probabilidad de éxito con los permisos correctos
- **Fallback claro**: Si el iframe falla, la opción de nueva pestaña está visible y prominente

