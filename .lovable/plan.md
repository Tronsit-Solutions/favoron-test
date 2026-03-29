

## Verificación y Mejora del Botón de Chat en Móvil

### Estado Actual
El botón de chat (burbuja azul con ícono `MessageCircle`) **ya está implementado** y debería funcionar en móvil:
- Usa `e.stopPropagation()` para evitar que el `CollapsibleTrigger` intercepte el click
- El `Dialog` se abre con `max-w-4xl h-[85vh]`

### Mejora Propuesta
Optimizar el modal del chat para pantallas móviles, ya que el `DialogContent` tiene padding `p-6` fijo (48px total) que consume espacio valioso en pantallas de ~390px.

### Cambios

**1. `CollapsiblePackageCard.tsx` — Chat Dialog (línea ~1372)**
- Agregar clases responsive al DialogContent: `sm:max-w-4xl max-w-[95vw] sm:h-[85vh] h-[90vh] p-3 sm:p-6`

**2. `CollapsibleTravelerPackageCard.tsx` — Chat Dialog (línea ~970)**
- Mismo ajuste responsive al DialogContent

**3. `MatchChatModal.tsx` — Admin Chat Dialog**
- Mismo ajuste para consistencia

### Detalle técnico
```tsx
// Antes
<DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">

// Después
<DialogContent className="max-w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden p-3 sm:p-6">
```

Esto asegura que en móvil el chat ocupe más espacio de pantalla con menos padding desperdiciado.

