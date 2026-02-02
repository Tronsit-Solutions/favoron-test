
# Plan: Prevenir Duplicación de Órdenes de Reembolso

## Problema

Las órdenes de reembolso se están duplicando porque:
1. No hay validación antes de crear una nueva orden
2. No hay constraint a nivel de base de datos para prevenir duplicados
3. El usuario puede hacer doble clic antes de que se active el estado `isSubmitting`

## Solución

### 1. Validación en el Hook (Primera Línea de Defensa)

Modificar `useRefundOrders.tsx` para verificar si ya existe una orden pendiente antes de crear:

```typescript
const createRefundOrder = async (params: CreateRefundOrderParams): Promise<RefundOrder | null> => {
  try {
    setCreating(true);
    
    // NUEVO: Verificar si ya existe una orden pendiente para este paquete
    const { data: existingOrder } = await supabase
      .from('refund_orders')
      .select('id')
      .eq('package_id', params.packageId)
      .in('status', ['pending', 'approved'])
      .maybeSingle();
    
    if (existingOrder) {
      toast.error('Ya existe una solicitud de reembolso pendiente para este paquete');
      return null;
    }
    
    // Continuar con la creación...
  }
}
```

### 2. Constraint en Base de Datos (Segunda Línea de Defensa)

Crear una función RPC con advisory lock para serializar las operaciones:

```sql
CREATE OR REPLACE FUNCTION create_refund_order_safe(
  p_package_id uuid,
  p_shopper_id uuid,
  p_bank_name text,
  p_bank_account_holder text,
  p_bank_account_number text,
  p_bank_account_type text,
  p_amount numeric,
  p_reason text,
  p_cancelled_products jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_refund_id uuid;
BEGIN
  -- Serializar acceso para este paquete
  PERFORM pg_advisory_xact_lock(hashtext('refund_' || p_package_id::text));
  
  -- Verificar si ya existe una orden pendiente
  IF EXISTS (
    SELECT 1 FROM refund_orders
    WHERE package_id = p_package_id
      AND status IN ('pending', 'approved')
  ) THEN
    RAISE EXCEPTION 'Ya existe una orden de reembolso pendiente';
  END IF;
  
  -- Crear la orden
  INSERT INTO refund_orders (...)
  VALUES (...)
  RETURNING id INTO new_refund_id;
  
  RETURN new_refund_id;
END; $$;
```

### 3. Mejora en UI (Tercera Línea de Defensa)

- Usar el estado `creating` del hook para deshabilitar el botón inmediatamente
- Verificar si el producto ya tiene `cancelled: true` antes de mostrar la opción

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useRefundOrders.tsx` | Agregar validación de duplicados antes de insert |
| Nueva migración SQL | Crear función RPC `create_refund_order_safe` |
| `src/components/dashboard/ProductCancellationModal.tsx` | Usar estado `creating` del hook |

## Limpieza de Datos Existentes

Después de implementar, se deben eliminar los duplicados existentes manualmente desde el admin (rechazando los duplicados).
