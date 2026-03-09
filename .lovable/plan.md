

## Reemplazar caja verde de dirección por un botón

### Cambio en `src/components/dashboard/CollapsiblePackageCard.tsx`

**Líneas 577-617 (sección "Office Pickup Address Section - Mobile"):**

Reemplazar toda la caja verde (`bg-success/10 border-2 border-success/30`) por un solo botón compacto que abra el modal de oficina (`setShowOfficeModal(true)`), el cual ya existe y muestra dirección + horarios.

```tsx
{/* Office Pickup Address - Mobile */}
{shouldShowOfficeAddress && companyInfo && (
  <div className="pl-5">
    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs border-success/30 text-success hover:bg-success/10"
      onClick={(e) => {
        e.stopPropagation();
        setShowOfficeModal(true);
      }}
    >
      <MapPin className="h-3.5 w-3.5 mr-1.5" />
      Ver dirección y horarios de recolección
    </Button>
  </div>
)}
```

Esto reduce significativamente el tamaño vertical de la tarjeta en móvil, y toda la información (dirección, teléfono, horarios) se ve al abrir el modal que ya existe.

