

## Chatbot basado en reglas en el SupportBubble

### Concepto
Agregar una tercera opcion al menu del SupportBubble: un chatbot interactivo que guia al usuario por flujos predefinidos tipo arbol de decision, sin costo de IA. El usuario selecciona opciones y el bot responde con informacion relevante o lo redirige a WhatsApp si necesita ayuda humana.

### Flujos del chatbot

1. **Mis pedidos** - Estado del pedido, tiempos de entrega, seguimiento
2. **Pagos** - Metodos de pago, problemas con cobros, reembolsos
3. **Viajeros** - Como registrarse, requisitos, pagos a viajeros
4. **Entregas** - Puntos de entrega, horarios, direcciones
5. **General** - Como funciona Favoron, productos permitidos, seguridad

Cada flujo tiene 2-3 niveles de profundidad con respuestas predefinidas. Si el usuario no encuentra respuesta, se ofrece boton de WhatsApp.

### Cambios tecnicos

**Archivo: `src/components/SupportBubble.tsx`**

- Agregar nuevo tipo de vista `"chatbot"` al type `View`
- Agregar boton "Asistente virtual" al menu principal (icono Bot/Sparkles)
- Crear interfaz de chat con burbujas de mensaje (bot y usuario)
- Implementar logica de arbol de decision con estado local
- Cada nodo del arbol tiene: mensaje del bot + opciones clickeables
- Al final de cada rama: respuesta + boton "Hablar con una persona" (WhatsApp)
- Boton "Volver al inicio" para reiniciar el flujo

**Archivo nuevo: `src/lib/chatbotFlows.ts`**

- Estructura de datos del arbol de decision
- Cada nodo: `{ id, botMessage, options: [{ label, nextNodeId }] }`
- Nodos terminales con `response` en vez de `options`
- Facil de extender agregando mas nodos sin tocar componentes

### Interfaz del chatbot

- Apariencia de chat con burbujas (bot a la izquierda, usuario a la derecha)
- Las opciones del usuario se muestran como botones clickeables debajo del ultimo mensaje del bot
- Al hacer click, la opcion aparece como burbuja del usuario y el bot responde
- ScrollArea para historial de mensajes
- Boton "Reiniciar conversacion" en la parte inferior

### Sin dependencias nuevas
Todo se implementa con componentes existentes (Button, ScrollArea, cn) sin librerias adicionales.

