

## Rediseñar la sección de "Notas adicionales" en el modal Tip Asignado

### Cambio

**Archivo: `src/components/QuoteDialog.tsx`** — Líneas 1030-1035

Reemplazar el texto simple con un bloque estilizado con encabezado "Nota Adicional del Shopper":

```tsx
{packageDetails.additional_notes && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
    <p className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
      📝 Nota Adicional del Shopper:
    </p>
    <p className="text-sm text-amber-900 leading-relaxed">
      {packageDetails.additional_notes}
    </p>
  </div>
)}
```

Esto le da mayor visibilidad al comentario del shopper con un fondo ámbar distintivo, un título claro y mejor legibilidad.

