
# Plan: Reducir tamaño del cuadro de texto del chat

## Problema

En la imagen se ve claramente que:
1. El área de entrada de mensajes ocupa ~40% del espacio del modal
2. Solo se ve un mensaje parcialmente cortado
3. El textarea tiene `min-h-[50px]` que es demasiado alto para un chat
4. Hay espaciado excesivo entre elementos

## Solución

### Archivo: `src/components/chat/MessageInput.tsx`

Compactar el diseño del input:

| Línea | Antes | Después |
|-------|-------|---------|
| 123 | `p-2` | `p-1.5` (reducir padding externo) |
| 142 | `space-y-2` | `space-y-1` (reducir gap vertical) |
| 149 | `min-h-[50px] ... py-2` | `min-h-[36px] max-h-[60px] ... py-1.5` (altura mínima reducida, máxima limitada) |
| 157 | `gap-2` | `gap-1` (reducir gap botones) |
| 166 | `h-8` | `h-7` (botón más pequeño) |
| 190 | `h-8 px-3` | `h-7 px-2` (botón enviar más pequeño) |

### Archivo: `src/components/chat/PackageTimeline.tsx`

Reducir padding del contenedor del input:

| Línea | Antes | Después |
|-------|-------|---------|
| 97 | `p-2` | `p-1.5` (reducir padding del wrapper) |

## Resultado esperado

El área de entrada pasará de ~150px de altura a ~70px, liberando ~80px adicionales para mostrar más mensajes del chat.
