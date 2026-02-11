
CREATE OR REPLACE FUNCTION public.fix_refund_completed_dates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Files uploaded on Jan 6, 2026
  UPDATE refund_orders SET completed_at = '2026-01-06T14:25:53+00'
  WHERE id IN ('1d6c07df-e14e-4039-960c-74172a010962', '574812dd-688d-4f3e-a22e-e6e78a2a611a');

  -- Files uploaded on Jan 21, 2026
  UPDATE refund_orders SET completed_at = '2026-01-21T20:07:59+00'
  WHERE id IN ('ff0005b7-3c6a-42cc-938f-964b3912be34', 'a04d8320-8c74-409a-ad11-04e8ce2e4d32',
               '015fd8ad-66b0-4abc-b1be-d8219c780177', '886d58fa-93c8-44a7-9e1e-0fd3196933d8');

  -- File uploaded on Feb 9, 2026
  UPDATE refund_orders SET completed_at = '2026-02-09T09:39:28+00'
  WHERE id = 'd929c6cd-c6a1-4bad-95aa-502feb64707f';

  -- No receipt - use created_at as completed_at
  UPDATE refund_orders SET completed_at = created_at
  WHERE id IN ('254b659c-22a0-4479-a4b2-6757d9424ac5', '86c8f506-e12f-42df-a01b-efb1dc1657a1', 'fa59c7eb-748b-459f-82c4-3c1b1e066585');
END;
$$;

SELECT fix_refund_completed_dates();
DROP FUNCTION public.fix_refund_completed_dates();
