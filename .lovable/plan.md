
# Plan: Corregir Modal de Chat Cortado

## Problema Identificado

El modal del chat se corta porque hay alturas fijas acumuladas que exceden el límite del viewport:

```
DialogContent: max-h-[80vh]
├── DialogHeader: ~50px
├── Info del paquete: ~70px
└── Container PackageTimeline: h-[500px]
    └── Card interno: h-[500px] ← Duplicado innecesario
        ├── Header chat: ~60px
        ├── Mensajes: flex-1
        └── MessageInput: ~100px ← SE CORTA
```

El `MessageInput` queda fuera del área visible porque 500px + 500px + headers > 80vh.

---

## Solución

Eliminar la altura fija duplicada en `MatchChatModal.tsx` y usar flexbox para que el contenido se adapte correctamente al espacio disponible.

---

## Cambios Requeridos

### Archivo: `src/components/admin/matching/MatchChatModal.tsx`

**Líneas 51-86 - Reestructurar layout:**

```tsx
return (
  <Dialog open={!!selectedPackage} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Chat del Match</span>
        </DialogTitle>
      </DialogHeader>
      
      {/* Info del paquete - altura fija */}
      <div className="mb-2 p-3 bg-muted rounded-lg shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{selectedPackage.item_description}</p>
            <p className="text-xs text-muted-foreground">
              Shopper: {selectedPackage.user_id} | 
              {selectedPackage.matched_trip_id && (
                <span> Viajero: {travelerInfo}</span>
              )}
            </p>
          </div>
          <Badge className={`text-xs ${statusInfo.color}`}>
            {statusInfo.icon} {statusInfo.label}
          </Badge>
        </div>
      </div>
      
      {/* PackageTimeline - ocupa resto del espacio */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PackageTimeline 
          pkg={selectedPackage} 
          className="h-full"
        />
      </div>
    </DialogContent>
  </Dialog>
);
```

**Cambios clave:**
- `h-[85vh]` en lugar de `max-h-[80vh]` para altura definida
- `flex flex-col` para layout vertical
- `shrink-0` en el header del paquete para que no se comprima
- `flex-1 min-h-0` en el container del chat para ocupar el espacio restante

---

### Archivo: `src/components/chat/PackageTimeline.tsx`

**Líneas 51-54 - Adaptar altura al contenedor padre:**

```tsx
return (
  <Card className={`${className} bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg flex flex-col`}>
    {/* Usar h-full en lugar de h-[500px] para heredar del padre */}
    <div className="flex flex-col h-full p-4">
```

**Cambio:** Línea 54 cambia de `h-[500px]` a `h-full` para que el chat use todo el espacio disponible del contenedor padre.

---

## Resultado Visual

```
┌─────────────────────────────────────────┐
│ Chat del Match                        X │ ← Header fijo
├─────────────────────────────────────────┤
│ Sneakers Reebok... [Pago confirmado]    │ ← Info paquete (shrink-0)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Chat del Paquete                    │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Mensajes...                     │ │ │ ← Área de scroll (flex-1)
│ │ │ ...                             │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ [📎 Adjuntar]  [Escribe...] ➤  │ │ │ ← Input visible (shrink-0)
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Resumen de Cambios

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `MatchChatModal.tsx` | 53 | `max-h-[80vh]` → `h-[85vh] flex flex-col` |
| `MatchChatModal.tsx` | 61-84 | Reestructurar con `shrink-0` y `flex-1 min-h-0` |
| `PackageTimeline.tsx` | 54 | `h-[500px]` → `h-full` |

---

## Beneficio Adicional

Este fix también resuelve el warning en la consola:
```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}
```

Podemos agregar un `DialogDescription` oculto para accesibilidad.
