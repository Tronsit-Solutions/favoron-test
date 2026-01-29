

# Plan: Agregar botón de edición de tip en el Resumen del Pedido

## Objetivo

Añadir un botón de edición (icono de lápiz) junto al valor de "Tips Asignados" en la sección "Resumen del Pedido" del `PackageDetailModal`, permitiendo al admin editar los tips rápidamente sin tener que bajar hasta la sección de "Cotización".

## Archivo a modificar

**`src/components/admin/PackageDetailModal.tsx`**

## Cambio específico (líneas 1599-1604)

**Código actual:**
```tsx
{totalAdminTips > 0 && (
  <div className="text-center">
    <p className="font-medium text-muted-foreground">Tips Asignados</p>
    <p className="text-base font-bold text-green-600">Q{totalAdminTips.toFixed(2)}</p>
  </div>
)}
```

**Código nuevo:**
```tsx
{totalAdminTips > 0 && (
  <div className="text-center">
    <p className="font-medium text-muted-foreground">Tips Asignados</p>
    <div className="flex items-center justify-center gap-1">
      <p className="text-base font-bold text-green-600">Q{totalAdminTips.toFixed(2)}</p>
      {pkg.quote && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setQuoteEditModalOpen(true)}
          className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
          title="Editar tip"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  </div>
)}
```

## Verificaciones necesarias

- El icono `Edit2` ya está importado en el archivo (verificado)
- El estado `quoteEditModalOpen` y `setQuoteEditModalOpen` ya existen
- El componente `QuoteEditModal` ya está renderizado en el modal

## Comportamiento esperado

| Tipo de pedido | Acción al hacer clic |
|----------------|---------------------|
| Un solo producto | Abre modal para editar tip, service fee y delivery fee directamente |
| Múltiples productos | Abre modal intermedio que lleva al editor de tips por producto (`ProductTipAssignmentModal`) |

## Resultado visual

```text
+----------------------------------+
| Resumen del Pedido:              |
+----------------------------------+
| Total Productos | Valor Total    |
|        2        |    $75.00      |
|                                  |
| Tips Asignados  | Método Entrega |
|  Q115.00 ✏️     | Envío domicilio|
+----------------------------------+
```

