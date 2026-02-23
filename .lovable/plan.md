

## Sincronizar FAQs del Soporte con las del Landing Page

### Problema
El componente `SupportBubble` tiene 5 preguntas frecuentes con respuestas resumidas, mientras que el `FAQSection` del landing tiene 7 preguntas con respuestas mas completas. Deben ser las mismas.

### Solucion
Actualizar el array `faqs` en `src/components/SupportBubble.tsx` para que use exactamente las mismas 7 preguntas y respuestas que estan en `src/components/FAQSection.tsx`.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/SupportBubble.tsx` | Reemplazar el array `faqs` con las 7 preguntas y respuestas del FAQSection |

### Detalle
Se agregan las 2 preguntas faltantes:
- "Es seguro usar Favoron?"
- "Que productos puedo enviar?"

Y se actualizan las respuestas de las 5 existentes para que coincidan exactamente con las del landing page (versiones mas completas).

