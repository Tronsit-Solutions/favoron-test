

## Plan: Agregar columna "Mensaje" a la tabla de aplicaciones

### Cambio
En `src/components/admin/AdminApplicationsTab.tsx`:

1. **Agregar `<TableHead>Mensaje</TableHead>`** entre "Tipo" y "Fecha" (línea ~128)
2. **Agregar `<TableCell>` con el mensaje** entre la celda de Tipo y la de Fecha (después de línea ~140), truncado para no ocupar demasiado espacio:

```tsx
<TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
  {app.message || "—"}
</TableCell>
```

Un solo archivo modificado, dos líneas añadidas.

