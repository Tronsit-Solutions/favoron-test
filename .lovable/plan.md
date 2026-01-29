
# Plan: Corregir visualización del Chat en Modal

## Problema Identificado

En la imagen se ve que el área de mensajes está cortada - solo se ve parcialmente el mensaje de "Maria Martinez" y no hay espacio suficiente para mostrar el contenido completo. El problema está en la cadena de flex heights que no se propaga correctamente desde el modal hasta el `ScrollArea`.

## Causa Raíz

El `PackageTimeline` usa un layout flex con `flex-1` para el área de mensajes, pero:
1. El `Card` wrapper añade padding interno que no está considerado en el cálculo
2. El contenedor de mensajes (línea 69) tiene `flex-1` pero su padre inmediato no tiene altura explícita
3. La clase `h-full` pasada al componente no se propaga al contenedor flex interno

## Solución

### Archivo: `src/components/chat/PackageTimeline.tsx`

Corregir la estructura de layout para que la altura se propague correctamente:

```typescript
// ANTES (línea 51-52):
return (
  <Card className={`${className} bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg flex flex-col`}>
    {/* Chat container - inherits height from parent */}
    <div className="flex flex-col h-full p-4">

// DESPUÉS:
return (
  <Card className={`${className} bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg flex flex-col overflow-hidden`}>
    {/* Chat container - flex-1 para ocupar todo el espacio disponible */}
    <div className="flex flex-col flex-1 min-h-0 p-4">
```

Y también asegurar que el contenedor del ScrollArea tenga altura explícita:

```typescript
// ANTES (línea 69-70):
<div className="flex-1 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/30 shadow-inner p-2 mb-3 min-h-0">
  <ScrollArea className="h-full w-full">

// DESPUÉS:
<div className="flex-1 min-h-0 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/30 shadow-inner p-2 mb-3 overflow-hidden">
  <ScrollArea className="h-full w-full">
```

## Cambios Específicos

| Línea | Cambio |
|-------|--------|
| 52 | Añadir `overflow-hidden` al Card |
| 54 | Cambiar `h-full` por `flex-1 min-h-0` en el contenedor interno |
| 69 | Añadir `overflow-hidden` al contenedor del ScrollArea |

## Resultado Esperado

El chat mostrará correctamente todos los mensajes con scroll funcional, el área de mensajes ocupará el espacio disponible entre el header y el input, y el input de mensaje se mantendrá fijo en la parte inferior.
