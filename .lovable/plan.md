

## Ajustar layout móvil de tarjetas de paquete

### Cambios en `src/components/dashboard/CollapsiblePackageCard.tsx`

**1. Permitir que el badge rojo no se corte:**
- Línea 358: el Card tiene `overflow-hidden` condicional. Ya se excluye en móvil con `isMobile && viewMode === 'user' ? '' : 'overflow-hidden'`, pero falta asegurar que el padre no lo corte. Agregar `overflow-visible` explícito cuando es móvil user.

**2. Reestructurar layout móvil (líneas 399-416):**
Cambiar de tener el chat button inline con el título a un layout de dos columnas:
- Columna izquierda: contenido del card (título, ID, status, acciones)
- Columna derecha: chat button centrado verticalmente + tres puntos en esquina superior

```text
┌─────────────────────────────┐
│ 📦 Pedido de 3 prod...  💬 ⋯│
│ ID: 36827fe7                │
│ [Cotización Pagada] Ver det │
│ [Subir comprobante compra]  │
└─────────────────────────────┘
```

Estructura nueva del bloque móvil:
```tsx
<div className="flex w-full">
  {/* Left: all content */}
  <div className="flex-1 min-w-0 space-y-3">
    {/* título, ID, status, actions... */}
  </div>
  {/* Right: chat button centered vertically */}
  <div className="flex flex-col items-center justify-center flex-shrink-0 ml-2">
    {isChatAvailable && <Button chat />}
  </div>
</div>
```

**3. Mover los tres puntos:** Ya están en `absolute top-2 right-2`, lo cual es correcto. Solo asegurar que el padding derecho del contenido deje espacio (`pr-10`).

**4. Chat a media altura:** Con `justify-center` en la columna derecha, el botón de chat queda centrado verticalmente respecto al contenido del card.

