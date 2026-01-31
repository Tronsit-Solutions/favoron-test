

## Plan: Habilitar Edición de Notas Adicionales del Shopper para Admin

### Problema Identificado

Al revisar el código, encontré que cuando el admin hace clic en el ícono de lápiz junto a "Notas Adicionales del Shopper", se activa el modo de edición COMPLETO del modal (todos los campos se vuelven editables), lo cual puede ser confuso y potencialmente causar que los cambios no se guarden correctamente si el admin no completa el flujo de guardado.

### Análisis del Código Actual

```text
+---------------------------+
|  Flujo actual (confuso)   |
+---------------------------+
| 1. Admin ve "Sin notas"   |
|    con ícono de lápiz     |
|                           |
| 2. Click en lápiz →       |
|    TODO el modal entra    |
|    en modo edición        |
|                           |
| 3. Textarea aparece AQUÍ  |
|    + 20 campos más        |
|                           |
| 4. Debe buscar "Guardar"  |
|    en header del modal    |
+---------------------------+
```

**Problema clave**: El admin podría no darse cuenta que necesita hacer clic en "Guardar" en la parte superior del modal, o podría cerrar el modal sin guardar.

---

### Solución Propuesta

Agregar un modo de **edición inline** específico para las notas adicionales, independiente del modo de edición completo del modal.

---

### Cambios Técnicos

#### 1. Agregar nuevo estado para edición inline de notas

**Archivo**: `src/components/admin/PackageDetailModal.tsx`

**Líneas ~168-173** - Agregar estado:
```typescript
const [editMode, setEditMode] = useState(false);
const [inlineNotesEdit, setInlineNotesEdit] = useState(false); // NUEVO
const [inlineNotesValue, setInlineNotesValue] = useState('');   // NUEVO
```

#### 2. Agregar función para guardar notas inline

**Líneas ~640-650** - Nueva función:
```typescript
// Handle inline notes save (quick edit without full modal edit mode)
const handleSaveInlineNotes = async () => {
  if (onUpdatePackage) {
    const updates = {
      additional_notes: inlineNotesValue?.trim() || null
    };
    onUpdatePackage(pkg.id, updates);
    toast({
      title: "Notas guardadas",
      description: "Las notas adicionales se han actualizado correctamente."
    });
  }
  setInlineNotesEdit(false);
};
```

#### 3. Modificar la sección de notas adicionales

**Líneas ~1657-1680** - Reemplazar con:
```typescript
{/* Additional Notes from Shopper - with inline edit capability */}
<div className="mt-3 pt-3 border-t border-primary/20">
  <h5 className="font-medium text-xs text-muted-foreground mb-2 flex items-center gap-2">
    Notas Adicionales del Shopper:
    {!editMode && !inlineNotesEdit && (
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-5 w-5 p-0" 
        onClick={() => {
          setInlineNotesValue(pkg.additional_notes || '');
          setInlineNotesEdit(true);
        }}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    )}
  </h5>
  
  {/* Full edit mode - uses editForm */}
  {editMode ? (
    <Textarea
      value={editForm.additional_notes}
      onChange={(e) => handleFormChange('additional_notes', e.target.value)}
      placeholder="Notas adicionales del shopper..."
      className="text-xs"
      rows={3}
    />
  ) : inlineNotesEdit ? (
    /* Inline edit mode - independent quick edit */
    <div className="space-y-2">
      <Textarea
        value={inlineNotesValue}
        onChange={(e) => setInlineNotesValue(e.target.value)}
        placeholder="Notas adicionales del shopper..."
        className="text-xs"
        rows={3}
        autoFocus
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSaveInlineNotes} className="text-xs">
          <Save className="h-3 w-3 mr-1" />
          Guardar
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInlineNotesEdit(false)} className="text-xs">
          Cancelar
        </Button>
      </div>
    </div>
  ) : (
    /* Read-only view */
    <p className="text-xs text-foreground bg-muted/30 p-2 rounded">
      {pkg.additional_notes || 'Sin notas adicionales'}
    </p>
  )}
</div>
```

---

### Resultado Esperado

```text
+---------------------------+
|   Nuevo flujo (simple)    |
+---------------------------+
| 1. Admin ve "Sin notas"   |
|    con ícono de lápiz     |
|                           |
| 2. Click en lápiz →       |
|    SOLO aparece Textarea  |
|    con botones inline     |
|                           |
| 3. Escribe las notas      |
|                           |
| 4. Click "Guardar" →      |
|    Se guarda directamente |
|    sin cerrar el modal    |
+---------------------------+
```

1. El admin puede editar las notas SIN entrar en modo de edición completo
2. Los botones "Guardar" y "Cancelar" aparecen junto al campo
3. El guardado es inmediato y muestra confirmación
4. El modo de edición completo sigue funcionando igual

