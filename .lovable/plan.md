

## Auto-expirar pedidos aprobados con fecha limite vencida

### Situacion actual
- Cuando un pedido `approved` supera su `delivery_deadline`, solo se muestra una alerta visual en el dashboard del shopper
- No hay cambio automatico de estado -- el pedido queda en `approved` indefinidamente
- El shopper puede reprogramar manualmente, pero solo si entra al dashboard

### Propuesta

Agregar logica automatica al edge function `expire-quotes` (que ya corre periodicamente via cron) para tambien mover pedidos `approved` con `delivery_deadline` vencida al estado `deadline_expired`.

### Cambios

**1. Migracion de base de datos**

- Agregar `deadline_expired` como valor valido en el constraint de `status` de la tabla `packages` (si no existe ya)
- Crear una funcion SQL `expire_approved_deadlines()` que:
  - Busque paquetes con `status = 'approved'` y `delivery_deadline < now()`
  - Los mueva a `status = 'deadline_expired'`
  - Retorne el conteo de paquetes actualizados

**2. Edge function `expire-quotes/index.ts`**

- Agregar una llamada a `supabase.rpc('expire_approved_deadlines')` despues de la expiracion de cotizaciones existente
- Loguear el resultado

**3. UI en `ShopperPackagePriorityActions.tsx`**

- Agregar case `'deadline_expired'` en `getActionConfig()` con:
  - Titulo: "Fecha limite vencida"
  - Descripcion: "No logramos encontrar un viajero disponible antes de tu fecha limite. Puedes reprogramar una nueva fecha para seguir buscando."
  - Boton: "Reprogramar fecha limite" (misma logica actual que abre el AlertDialog con calendario)
- Al reprogramar, cambiar el status de vuelta a `approved` con la nueva fecha

**4. Admin dashboard**

- Agregar `'deadline_expired'` a los filtros y badges de estado en los componentes admin que muestran paquetes
- El admin podra ver cuales pedidos expiraron su fecha limite

### Detalle tecnico

Funcion SQL:
```sql
CREATE OR REPLACE FUNCTION expire_approved_deadlines()
RETURNS jsonb AS $$
DECLARE
  expired_count integer;
BEGIN
  UPDATE packages
  SET status = 'deadline_expired',
      updated_at = now()
  WHERE status = 'approved'
    AND delivery_deadline < now();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  RETURN jsonb_build_object('expired_count', expired_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Logica de reprogramacion (ya existente, solo ajustar):
```typescript
// Al reprogramar, volver a approved
await supabase
  .from('packages')
  .update({ 
    status: 'approved',
    delivery_deadline: newDeadline.toISOString() 
  })
  .eq('id', pkg.id);
```

### Flujo completo

1. Shopper crea pedido -> estado `approved`
2. Cron ejecuta `expire-quotes` periodicamente
3. Si `delivery_deadline` paso -> estado cambia a `deadline_expired`
4. Shopper ve alerta en su dashboard con opcion de reprogramar
5. Si reprograma -> vuelve a `approved` con nueva fecha
6. Si no reprograma -> queda en `deadline_expired` visible para admin

### Archivos a modificar
- Nueva migracion SQL (funcion + constraint)
- `supabase/functions/expire-quotes/index.ts`
- `src/components/dashboard/shopper/ShopperPackagePriorityActions.tsx`
- `src/utils/statusHelpers.ts` (agregar label/color para el nuevo estado)
- Componentes admin que filtran por status (agregar `deadline_expired`)

