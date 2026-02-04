
## Notificaciones por Email para Mensajes del Chat

### Resumen

Implementar notificaciones por correo electronico cuando un shopper o viajero recibe un nuevo mensaje en el chat interno, incluyendo:
- Vista previa del mensaje
- Nombre del remitente
- Enlace directo al dashboard para ver el chat

---

### Cambios Tecnicos

#### 1. Agregar tipo de notificacion "chat" en EmailNotificationSettings.tsx

**Archivo: src/components/profile/EmailNotificationSettings.tsx**

Agregar nuevo tipo en el array `notificationTypes` (linea 17-25):

```tsx
const notificationTypes = [
  { key: 'package', label: 'Paquetes', description: 'Nuevos paquetes, cotizaciones y actualizaciones de estado', icon: Package },
  { key: 'trip', label: 'Viajes', description: 'Nuevos viajes asignados y actualizaciones', icon: Plane },
  { key: 'payment', label: 'Pagos', description: 'Ordenes de pago y confirmaciones financieras', icon: CreditCard },
  { key: 'approval', label: 'Aprobaciones', description: 'Solicitudes que requieren aprobacion', icon: CheckCircle },
  { key: 'quote', label: 'Cotizaciones', description: 'Nuevas cotizaciones recibidas', icon: MessageSquare },
  { key: 'delivery', label: 'Entregas', description: 'Confirmaciones de entrega y recogida', icon: Truck },
  { key: 'chat', label: 'Chat', description: 'Mensajes nuevos en el chat con shoppers o viajeros', icon: MessageCircle },  // NUEVO
  { key: 'general', label: 'Generales', description: 'Notificaciones generales del sistema', icon: Bell }
];
```

Agregar import de `MessageCircle` de lucide-react.

---

#### 2. Crear funcion de notificacion por email en usePackageChat.tsx

**Archivo: src/hooks/usePackageChat.tsx**

Agregar funcion para enviar notificacion por email despues de enviar mensaje (despues de linea 110):

```tsx
const sendChatEmailNotification = async (
  messageContent: string, 
  messageType: 'text' | 'file_upload',
  senderUserId: string
) => {
  try {
    // Get package details to determine shopper and traveler
    const { data: packageData, error: pkgError } = await supabase
      .from('packages')
      .select(`
        id,
        user_id,
        item_description,
        matched_trip_id,
        trips!packages_matched_trip_id_fkey (
          id,
          user_id
        )
      `)
      .eq('id', packageId)
      .single();

    if (pkgError || !packageData) {
      console.log('Could not fetch package data for chat notification');
      return;
    }

    const shopperId = packageData.user_id;
    const travelerId = (packageData.trips as any)?.user_id;

    // If no traveler assigned, skip notification
    if (!travelerId) {
      console.log('No traveler assigned, skipping chat notification');
      return;
    }

    // Determine recipient (the other party)
    let recipientId: string;
    let senderRole: string;

    if (senderUserId === shopperId) {
      recipientId = travelerId;
      senderRole = 'shopper';
    } else if (senderUserId === travelerId) {
      recipientId = shopperId;
      senderRole = 'viajero';
    } else {
      // Sender is admin or other - notify both parties
      console.log('Sender is not shopper or traveler, skipping notification');
      return;
    }

    // Get sender name
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', senderUserId)
      .single();

    const senderName = senderProfile 
      ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 'Usuario'
      : 'Usuario';

    // Truncate message for preview
    const messagePreview = messageContent.length > 100 
      ? messageContent.substring(0, 100) + '...' 
      : messageContent;

    const itemDescription = packageData.item_description || 'tu paquete';
    const truncatedItem = itemDescription.length > 50 
      ? itemDescription.substring(0, 50) + '...' 
      : itemDescription;

    // Build email content
    const title = messageType === 'file_upload' 
      ? `Nuevo archivo de ${senderName}`
      : `Nuevo mensaje de ${senderName}`;

    const message = messageType === 'file_upload'
      ? `<p><strong>${senderName}</strong> (${senderRole}) ha enviado un archivo en el chat de tu paquete:</p>
         <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0;">"${messagePreview}"</p>
         <p><strong>Paquete:</strong> ${truncatedItem}</p>`
      : `<p><strong>${senderName}</strong> (${senderRole}) te ha enviado un mensaje:</p>
         <p style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin: 16px 0; font-style: italic;">"${messagePreview}"</p>
         <p><strong>Paquete:</strong> ${truncatedItem}</p>`;

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        user_id: recipientId,
        title,
        message,
        type: 'chat',
        priority: 'normal',
        action_url: 'https://favoron.app/dashboard',
        metadata: {
          package_id: packageId,
          sender_id: senderUserId,
          message_type: messageType
        }
      }
    });

    console.log('Chat email notification sent to:', recipientId);
  } catch (error) {
    console.error('Error sending chat email notification:', error);
    // Don't throw - email notification failure shouldn't block chat
  }
};
```

---

#### 3. Llamar la funcion de notificacion despues de enviar mensaje

**En sendMessage (linea 101, despues del insert exitoso):**

```tsx
// Send email notification to the other party
await sendChatEmailNotification(content.trim(), type, user.id);
```

**En uploadFile (linea 183, despues del insert exitoso):**

```tsx
// Send email notification to the other party
await sendChatEmailNotification(
  description || `Archivo subido: ${file.name}`, 
  'file_upload', 
  user.id
);
```

---

#### 4. Agregar soporte para tipo 'chat' en el template de email

**Archivo: supabase/functions/send-notification-email/index.ts**

Agregar caso 'chat' en la funcion `getTypeColor` (linea 96-106):

```tsx
const getTypeColor = (type: string) => {
  switch (type) {
    case 'package': return 'background-color: #e3f2fd; color: #1976d2;';
    case 'trip': return 'background-color: #f3e5f5; color: #7b1fa2;';
    case 'payment': return 'background-color: #e8f5e8; color: #388e3c;';
    case 'approval': return 'background-color: #fff3e0; color: #f57c00;';
    case 'quote': return 'background-color: #fce4ec; color: #c2185b;';
    case 'delivery': return 'background-color: #e0f2f1; color: #00695c;';
    case 'chat': return 'background-color: #e8eaf6; color: #3f51b5;';  // NUEVO - color indigo
    default: return 'background-color: #f5f5f5; color: #757575;';
  }
};
```

---

### Flujo de Notificacion

```text
Usuario envia mensaje en chat
         |
         v
  Insert en package_messages
         |
         v
  sendChatEmailNotification()
         |
         v
  Obtener datos del paquete
  (shopper_id, traveler_id)
         |
         v
  Determinar destinatario
  (el otro participante)
         |
         v
  Llamar send-notification-email
  con tipo 'chat'
         |
         v
  Edge function verifica:
  - email_notifications = true
  - email_notification_preferences.chat = true
         |
         v
  Enviar email via Resend
```

---

### Ejemplo de Email Resultante

**Asunto:** Favoron - Nuevo mensaje de Juan Perez

**Contenido:**
- Badge: CHAT (color indigo)
- Titulo: "Nuevo mensaje de Juan Perez"
- Mensaje: Juan Perez (shopper) te ha enviado un mensaje: "Hola, queria preguntarte si ya compraste el producto..."
- Paquete: Hub USB C 7 en 1 Adaptador
- Boton: "Ver Detalles" → enlace al dashboard

---

### Consideraciones

1. **No bloquea el chat**: Si falla el envio del email, el mensaje se guarda igual
2. **Respeta preferencias**: Solo envia si el usuario tiene activadas las notificaciones de chat
3. **Sin spam**: Solo notifica al destinatario, nunca al remitente
4. **Admins excluidos**: Si un admin escribe en el chat, no se envia notificacion (evita ruido)
5. **Vista previa truncada**: Mensajes largos se cortan a 100 caracteres para el email
