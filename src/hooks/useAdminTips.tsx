
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminTipProduct {
  itemDescription: string;
  estimatedPrice: string; // Keep as string to match existing product data shape
  itemLink?: string;
  quantity?: string; // Defaults to '1' if not provided
  adminAssignedTip: number; // Tip per product
}

/**
 * Persists per-product tips directly into packages.products_data (JSONB),
 * regardless of single or multiple products.
 */
export const useAdminTips = () => {
  const { toast } = useToast();

  const saveProductTips = async (packageId: string, products: AdminTipProduct[]) => {
    // Normalize products to the expected JSON shape
    const normalizedProducts = products.map((p) => ({
      itemDescription: p.itemDescription ?? '',
      estimatedPrice: (p.estimatedPrice ?? '0').toString(),
      itemLink: p.itemLink ?? null,
      quantity: (p.quantity ?? '1').toString(),
      adminAssignedTip: Number.isFinite(p.adminAssignedTip) ? p.adminAssignedTip : 0,
    }));

    const { error } = await supabase
      .from('packages')
      .update({
        products_data: normalizedProducts as unknown as any, // Supabase will serialize to JSONB
      })
      .eq('id', packageId);

    if (error) {
      throw error;
    }

    // Small success toast here is optional; caller already handles UX
    toast({
      title: 'Tips guardados',
      description: 'Se guardaron los tips por producto correctamente.',
    });
  };

  return { saveProductTips };
};
