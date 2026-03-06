

## Agregar pestaña "Dashboard" para admins y distribuir pestañas equitativamente

### Cambios en `src/components/Dashboard.tsx`:

1. **Actualizar grid-cols** en el `TabsList`:
   - Para admins: cambiar de `sm:grid-cols-5` a `sm:grid-cols-5` (se mantiene 5: Dashboard, Home, Pedidos, Viajes, Admin)
   - Para usuarios normales: mantener `sm:grid-cols-3` (Home, Pedidos, Viajes)
   - Agregar `grid-cols-3` (o `grid-cols-5` para admin) también en mobile para distribución equitativa en lugar de `flex-wrap`

2. **Agregar nueva `TabsTrigger`** antes de "Home" (overview), solo visible para admins:
   ```
   {isAdminViewingAsAdmin && (
     <TabsTrigger value="admin-dashboard" className="...">
       Dashboard
     </TabsTrigger>
   )}
   ```

3. **Agregar `TabsContent`** vacío para `value="admin-dashboard"`:
   ```
   {isAdmin && (
     <TabsContent value="admin-dashboard">
       <div className="text-center text-muted-foreground py-12">
         Próximamente...
       </div>
     </TabsContent>
   )}
   ```

4. **Distribuir equitativamente**: Cambiar el layout de `flex flex-wrap` a `grid` siempre, usando `grid-cols-N` donde N depende de si es admin (5) o usuario (3), tanto en mobile como desktop. Eliminar `min-w-[...]` ya que el grid se encarga de la distribución.

