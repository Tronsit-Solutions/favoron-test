
-- Temporary function to fix refund order data (will be dropped after use)
CREATE OR REPLACE FUNCTION public.fix_refund_receipts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 7 orders with files in storage - restore receipt references
  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/d929c6cd-c6a1-4bad-95aa-502feb64707f-1770629975085.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = 'd929c6cd-c6a1-4bad-95aa-502feb64707f';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/ff0005b7-3c6a-42cc-938f-964b3912be34-1769026079648.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = 'ff0005b7-3c6a-42cc-938f-964b3912be34';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/886d58fa-93c8-44a7-9e1e-0fd3196933d8-1769025937313.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = '886d58fa-93c8-44a7-9e1e-0fd3196933d8';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/015fd8ad-66b0-4abc-b1be-d8219c780177-1769025787482.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = '015fd8ad-66b0-4abc-b1be-d8219c780177';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/a04d8320-8c74-409a-ad11-04e8ce2e4d32-1769025283906.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = 'a04d8320-8c74-409a-ad11-04e8ce2e4d32';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/1d6c07df-e14e-4039-960c-74172a010962-1767709562761.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = '1d6c07df-e14e-4039-960c-74172a010962';

  UPDATE refund_orders SET 
    receipt_url = 'refund-receipts/574812dd-688d-4f3e-a22e-e6e78a2a611a-1767709269139.png',
    receipt_filename = 'comprobante.png',
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id = '574812dd-688d-4f3e-a22e-e6e78a2a611a';

  -- 3 approved orders without files - mark as completed per user confirmation
  UPDATE refund_orders SET 
    status = 'completed', completed_at = now(), updated_at = now()
  WHERE id IN ('254b659c-22a0-4479-a4b2-6757d9424ac5', '86c8f506-e12f-42df-a01b-efb1dc1657a1', 'fa59c7eb-748b-459f-82c4-3c1b1e066585')
    AND status = 'approved';
END;
$$;

-- Execute
SELECT fix_refund_receipts();

-- Clean up
DROP FUNCTION public.fix_refund_receipts();
