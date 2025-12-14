-- Permitir a admins crear órdenes de reembolso en nombre de cualquier shopper
CREATE POLICY "Admins can create refund orders for any package" 
ON public.refund_orders
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);