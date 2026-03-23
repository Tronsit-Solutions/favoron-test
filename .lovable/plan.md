

## Agregar columna ID/DPI/Pasaporte a la tabla de usuarios

### Cambio
Agregar una nueva columna "Documento" entre "WhatsApp" y "Registro" que muestre el tipo y número de documento de identidad de cada usuario.

### Implementación — `src/components/admin/UserManagement.tsx`

**1. Agregar header** (línea ~447, entre WhatsApp y Registro):
```
<TableHead>Documento</TableHead>
```

**2. Agregar celda** (línea ~499, después de WhatsApp):
Mostrar tipo (DPI/Pasaporte) + número. Si no tiene, mostrar "Sin documento".
```tsx
<TableCell className="text-sm">
  {user.documentNumber ? (
    <div>
      <span className="text-xs text-muted-foreground uppercase">
        {user.documentType === 'passport' ? 'Pasaporte' : user.documentType?.toUpperCase() || 'ID'}
      </span>
      <p className="font-mono text-xs">{user.documentNumber}</p>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )}
</TableCell>
```

**3. Actualizar `colSpan`** del loading state de 8 a 9 (línea 457).

### Archivos
- **Modificar**: `src/components/admin/UserManagement.tsx`

