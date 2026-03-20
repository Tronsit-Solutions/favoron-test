

## Mover pestaña "Etiquetas" al final de la barra de tabs

### Cambio — `src/pages/Operations.tsx`

Reordenar los `TabsTrigger` dentro del `TabsList` para que "Etiquetas" quede después de "Incidencias":

**Orden actual**: Recepción → Preparación → **Etiquetas** → Completados → Buscar → Incidencias

**Orden nuevo**: Recepción → Preparación → Completados → Buscar → Incidencias → **Etiquetas**

Solo se mueven las líneas del TabsTrigger de "labels" al final del TabsList. El contenido (`div` con `OperationsLabelsTab`) no necesita moverse ya que usa renderizado condicional con `className={activeTab !== 'labels' ? 'hidden' : ''}`.

