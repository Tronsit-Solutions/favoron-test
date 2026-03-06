

## Eliminar pestaña "Última Milla" del dashboard admin

### Cambios en `src/components/Dashboard.tsx`:
1. Eliminar import de `LastMileTab`
2. Eliminar el `TabsTrigger` con `value="ultima-milla"` (líneas ~599-606)
3. Eliminar el `TabsContent` con `value="ultima-milla"` que renderiza `<LastMileTab>` (líneas ~974-981)

### Archivo a eliminar (opcional):
- `src/components/admin/LastMileTab.tsx` — ya no se usa en ningún lado

