# WhatsApp Templates - Favoron

Este documento describe los templates de WhatsApp configurados en Twilio para notificaciones automatizadas.

## 📋 Templates Activos

### 1. `welcome` - Bienvenida
**Secret:** `TWILIO_CONTENT_SID_WELCOME`

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| `{{1}}` | Nombre del usuario (auto-enriquecido) | "Carlos García" |

**Uso:** Se envía cuando un nuevo usuario completa el registro.

---

### 2. `quote_received_v2` - Cotización Recibida (Actual)
**Secret:** `TWILIO_CONTENT_SID_QUOTE_RECEIVED_V2`

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| `{{1}}` | Nombre del usuario (auto-enriquecido) | "María López" |
| `{{2}}` | Total de la cotización en Quetzales | "1,250.00" |
| `{{3}}` | Nombre/descripción del pedido | "iPhone 15 Pro Max" |

**Contenido:**
```
¡Hola {{1}}! 🎉

Has recibido una cotización para tu pedido.

💰 Total: Q{{2}} 

📦 Pedido: {{3}}

Ingresa a tu dashboard para ver los detalles y aceptar:

👉 www.favoron.app

_Este es un mensaje automático. No responder._
```

**Uso:** Se envía cuando el admin genera una cotización para un paquete.

---

### 3. `package_assigned` - Paquete Asignado a Viajero
**Secret:** `TWILIO_CONTENT_SID_PACKAGE_ASSIGNED`

| Variable | Campo | Ejemplo |
|----------|-------|---------|
| `{{1}}` | Nombre del viajero (auto-enriquecido) | "Lucas Martínez" |
| `{{2}}` | Destino del paquete | "Miami, Estados Unidos" |
| `{{3}}` | Propina en Quetzales | "Q 150.00" |

**Uso:** Se envía al viajero cuando se le asigna un nuevo paquete.

---

## ⚠️ Templates Deprecados

### `quote_received` (Deprecado - Usar `quote_received_v2`)
**Secret:** `TWILIO_CONTENT_SID_QUOTE_RECEIVED`

Este template está deprecado. Usar `quote_received_v2` que incluye:
- CTA al dashboard (www.favoron.app)
- Disclaimer de mensaje automático

---

## 🔧 Configuración de Secrets en Supabase

Los Content SIDs de cada template deben configurarse como secrets en Supabase:

| Secret Name | Descripción |
|-------------|-------------|
| `TWILIO_CONTENT_SID_WELCOME` | Content SID del template de bienvenida |
| `TWILIO_CONTENT_SID_QUOTE_RECEIVED` | ⚠️ Deprecado - Content SID del template de cotización v1 |
| `TWILIO_CONTENT_SID_QUOTE_RECEIVED_V2` | Content SID del template de cotización v2 (actual) |
| `TWILIO_CONTENT_SID_PACKAGE_ASSIGNED` | Content SID del template de paquete asignado |

### Secrets Base de Twilio (Requeridos)
- `TWILIO_ACCOUNT_SID` - Account SID de Twilio
- `TWILIO_AUTH_TOKEN` - Auth Token de Twilio
- `TWILIO_WHATSAPP_FROM` - Número de WhatsApp emisor (formato: `+14155238886`)

---

## 🧪 Modo Testing

El sistema está actualmente en **Testing Mode** (`TESTING_MODE = true`).

En este modo, solo se envían mensajes a los números en la whitelist:
- `+34699591457`

Para desactivar el modo testing y permitir envíos a todos los usuarios:
1. Editar `supabase/functions/send-whatsapp-notification/index.ts`
2. Cambiar `TESTING_MODE = true` a `TESTING_MODE = false`

---

## 🔄 Auto-enriquecimiento de Variables

La variable `{{1}}` se auto-enriquece automáticamente con el nombre completo del usuario cuando:
1. Se proporciona un `user_id` en la solicitud
2. El perfil del usuario tiene `first_name` (y opcionalmente `last_name`)

Esto significa que no necesitas enviar la variable `1` manualmente en la mayoría de los casos.

---

## 📝 Ejemplo de Uso

```typescript
// Enviar notificación de cotización recibida (v2)
await supabase.functions.invoke('send-whatsapp-notification', {
  body: {
    user_id: 'uuid-del-usuario',
    template_id: 'quote_received_v2',
    variables: {
      // Variable 1 se auto-enriquece con el nombre del usuario
      '2': '1,250.00',  // Total en Quetzales
      '3': 'iPhone 15 Pro Max'  // Nombre del producto
    }
  }
});

// Enviar notificación de paquete asignado a viajero
await supabase.functions.invoke('send-whatsapp-notification', {
  body: {
    user_id: 'uuid-del-viajero',
    template_id: 'package_assigned',
    variables: {
      // Variable 1 se auto-enriquece con el nombre del viajero
      '2': 'Miami, Estados Unidos',  // Destino
      '3': 'Q 150.00'  // Propina en Quetzales
    }
  }
});
```

---

## ⚠️ Notas Importantes

1. **Templates deben estar aprobados por WhatsApp/Meta** antes de poder usarse
2. **Ventana de 24 horas:** Solo se pueden enviar templates fuera de la ventana de conversación activa
3. **Error 63016:** Indica que el template no está aprobado o la ventana expiró
4. **Error 21656:** Ocurre al enviar variables a templates que no las esperan - usar `{}` si no hay variables

---

## 📊 Agregar Nuevos Templates

1. Crear el template en [Twilio Content Template Builder](https://console.twilio.com/us1/develop/sms/content-template-builder)
2. Esperar aprobación de WhatsApp/Meta (puede tomar 24-48 horas)
3. Copiar el Content SID (formato: `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
4. Agregar el secret en Supabase: `TWILIO_CONTENT_SID_<TEMPLATE_NAME>`
5. Agregar la entrada en `TEMPLATE_SIDS` en `send-whatsapp-notification/index.ts`
6. Documentar las variables en este archivo
